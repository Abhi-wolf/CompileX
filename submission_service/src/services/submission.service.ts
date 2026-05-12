import { getProblemById } from "../apis/problem.api";
import logger from "../config/logger.config";
import {
  EvaluationStatus,
  ISubmission,
  ISubmissionData,
  SubmissionStatus,
} from "../models/submission.model";
import { addSubmissionJob } from "../producers/submission.producer";
import { ISubmissionRepository } from "../repositories/submission.repository";
import {
  InternalServerError,
  NotFoundError,
  QueueOverloadError,
} from "../utils/errors/app.error";
import { CacheRepository } from "../repositories/cache.repository";
import { IRunCodeSubmission, ISubmissionJob } from "../types/submission.types";
import { serverConfig } from "../config";
import { generateHMACSignature } from "../utils/generateHMACSignature";
import { getContestById } from "../apis/contest.api";
export class SubmissionService {
  private submissionRepository: ISubmissionRepository;
  private cacheRepository: CacheRepository;

  constructor(
    submissionRepository: ISubmissionRepository,
    cacheRepository: CacheRepository,
  ) {
    this.submissionRepository = submissionRepository;
    this.cacheRepository = cacheRepository;
  }

  private async getProblemFromCache(problemId: string) {
    const cacheKey = `problem:${problemId}`;

    // 1. check cache
    const cachedProblem = await this.cacheRepository.getCachedProblem(cacheKey);

    if (cachedProblem) {
      logger.info(`Problem fetched from cache: ${problemId}`);
      return cachedProblem;
    }

    // 2. fetch from problem service
    const problem = await getProblemById(problemId);

    if (!problem) {
      return null;
    }

    // 3. store in cache
    await this.cacheRepository.setCachedProblem(cacheKey, problem);

    logger.info(`Problem cached after API fetch: ${problemId}`);

    return problem;
  }

  private async getContestProblemAndScoreFromCache(
    contestId: string,
    problemId: string,
  ) {
    const cacheKey = `contest:${contestId}`;

    // 1. check cache
    const cachedContest = await this.cacheRepository.getCachedContest(cacheKey);

    // console.log("cachedContest", cachedContest?.problems);

    const cachedProblem = cachedContest?.problems.find(
      (problem) => problem.problemId.id === problemId,
    );

    if (cachedProblem && cachedProblem.problemId) {
      logger.info(`Contest problem fetched from cache: ${contestId}`);

      return { problem: cachedProblem.problemId, points: cachedProblem.points };
    }

    // 2. fetch from contest service
    const contest = await getContestById(contestId);

    // console.log("contest", contest?.problems);

    if (!contest) {
      return null;
    }

    // 3. store in cache
    await this.cacheRepository.setCachedContest(cacheKey, contest);

    logger.info(`Contest cached after API fetch: ${contestId}`);

    const contestProblem = contest.problems.find(
      (problem) => problem.problemId.id === problemId,
    );

    // console.log("contestProblem", contestProblem);

    if (contestProblem && contestProblem.problemId) {
      return {
        problem: contestProblem.problemId,
        points: contestProblem.points,
      };
    }

    return null;
  }

  private isAllTestCasesPassed(testCases: ISubmissionData[]) {
    let failedTestCases = testCases?.filter(
      (testCase) => testCase.status !== EvaluationStatus.SUCCESS,
    );

    return failedTestCases?.length === 0;
  }

  async createContestSubmission(
    submissionData: Partial<ISubmission>,
    userId: string,
  ): Promise<ISubmission> {
    if (!submissionData.contestId) {
      throw new NotFoundError("Contest ID is required");
    }

    const contestProblemDetail = await this.getContestProblemAndScoreFromCache(
      submissionData.contestId!,
      submissionData.problemId!,
    );

    if (!contestProblemDetail) {
      throw new NotFoundError(
        `Problem with id ${submissionData.problemId} not found for contest ${submissionData.contestId}`,
      );
    }

    //   add the submission payload to the database
    const submission = await this.submissionRepository.create(
      submissionData,
      userId,
    );

    const jobData: ISubmissionJob = {
      submissionId: submission.id.toString(),
      problemId: submissionData.problemId!,
      code: submissionData.code!,
      language: submissionData.language!,
      testcases: contestProblemDetail.problem.testcases,
      contestId: submissionData?.contestId,
    };

    //   submission to redis queue for processing
    let jobId: string | null = null;

    try {
      jobId = await addSubmissionJob(jobData, serverConfig.EVALUATION_JOB_NAME);
      logger.info(`Added contest submission job with ID : ${jobId}`);
    } catch (error) {
      await this.submissionRepository.updateStatus(
        submission.id.toString(),
        SubmissionStatus.FAILED,
      );

      if (error instanceof QueueOverloadError) {
        throw error;
      }
      throw new InternalServerError(
        `Failed to add contest submission job for submission ID: ${submission.id}`,
      );
    }

    return submission;
  }

  async createSubmission(
    submissionData: Partial<ISubmission>,
    userId: string,
  ): Promise<ISubmission> {
    // get problem details from problem service
    const problem = await this.getProblemFromCache(submissionData.problemId!);

    if (!problem) {
      throw new NotFoundError(
        `Problem with id ${submissionData.problemId} not found`,
      );
    }

    //   add the submission payload to the database
    const submission = await this.submissionRepository.create(
      submissionData,
      userId,
    );

    const jobData: ISubmissionJob = {
      submissionId: submission.id.toString(),
      problemId: submissionData.problemId!,
      code: submissionData.code!,
      language: submissionData.language!,
      testcases: problem.testcases,
    };

    //   submission to redis queue for processing
    let jobId: string | null = null;

    try {
      jobId = await addSubmissionJob(jobData, serverConfig.EVALUATION_JOB_NAME);
      logger.info(`Added submission job with ID: ${jobId}`);
    } catch (error) {
      // mark the submission as failed
      await this.submissionRepository.updateStatus(
        submission.id.toString(),
        SubmissionStatus.FAILED,
      );

      if (error instanceof QueueOverloadError) {
        throw error;
      }
      throw new InternalServerError(
        `Failed to add submission job for submission ID: ${submission.id}`,
      );
    }

    return submission;
  }

  async createRun(
    submissionData: IRunCodeSubmission,
    userId: string,
  ): Promise<Partial<IRunCodeSubmission>> {
    const hashData = {
      code: submissionData.code,
      language: submissionData.language,
      testcases: submissionData.testcases,
    };

    // generate hash for the run code request -- used as cache key to prevent duplicate runs
    const hash = generateHMACSignature(
      JSON.stringify(hashData),
      "submission-service-run-code",
    );

    logger.info(`Hash generated for run code: ${hash}`);

    const cacheKey = `run:${hash}`;

    const cachedRunCodeStatus =
      await this.cacheRepository.getRunCodeStatus(cacheKey);

    if (cachedRunCodeStatus) {
      return {
        submissionId: hash,
        problemId: submissionData.problemId,
        code: submissionData.code,
        language: submissionData.language,
        testcases: submissionData.testcases,
      };
    }

    const jobData = {
      submissionId: hash,
      problemId: submissionData.problemId,
      code: submissionData.code!,
      language: submissionData.language!,
      testcases: submissionData.testcases,
    };

    let jobId: string | null = null;

    try {
      jobId = await addSubmissionJob(jobData, "RUN_CODE");

      await this.cacheRepository.setRunCodeStatus(
        cacheKey,
        JSON.stringify({ status: "added_to_queue" }),
      );

      logger.info(
        `Run code status set in cache with key: ${cacheKey} and job ID: ${jobId}`,
      );
    } catch (error) {
      if (error instanceof QueueOverloadError) {
        throw error;
      }
      throw new InternalServerError("Failed to add run job");
    }

    return {
      submissionId: jobData.submissionId,
      problemId: submissionData.problemId,
      code: submissionData.code,
      language: submissionData.language,
      testcases: submissionData.testcases,
      userId: userId,
      status: SubmissionStatus.PENDING,
      createdAt: new Date(),
    };
  }

  async getSubmissionById(id: string): Promise<ISubmission | null> {
    const submission = await this.submissionRepository.findById(id);

    if (!submission) {
      throw new NotFoundError(`Submission with id ${id} not found`);
    }
    return submission;
  }

  async updateSubmissionStatus(
    id: string,
    status: SubmissionStatus,
    submissionData: ISubmissionData[],
  ): Promise<ISubmission | null> {
    console.log("updateSubmissionStatus", id, status, submissionData);

    const submission = await this.submissionRepository.updateStatus(
      id,
      status,
      submissionData,
    );
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }
    return submission;
  }

  async updateContestSubmissionStatus(
    contestId: string,
    id: string,
    status: SubmissionStatus,
    submissionData: ISubmissionData[],
  ): Promise<ISubmission | null> {
    logger.info(
      `Updating contest submission status for contestId: ${contestId}, submissionId: ${id}, status: ${status}`,
    );

    const submission = await this.submissionRepository.updateStatus(
      id,
      status,
      submissionData,
    );

    // TODO: check if all test cases passed and update contest score -- before updating check whether that problem's submission
    // point is already added or not
    // redis cache -- {contestId}:{problemId}:{userId}:status
    // `contest:${contestId}:leaderboard`

    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    const submissionCheckKey = `contest:${contestId}:solved:${submission.userId}`;
    const contestLeaderboardKey = `contest:${contestId}:leaderboard`;

    const alltestcasepassed = this.isAllTestCasesPassed(submissionData);
    const contestProblemDetail = await this.getContestProblemAndScoreFromCache(
      contestId,
      submission.problemId,
    );

    if (alltestcasepassed && contestProblemDetail) {
      // check if the submission is made earlier or not

      // const isSubmitted = await this.cacheRepository.contestSubmissionExists(
      //   submissionCheckKey,
      //   submission.problemId,
      // );

      const isFirstSubmission = await this.cacheRepository.addContestSubmission(
        submissionCheckKey,
        submission.problemId,
      );

      if (isFirstSubmission) {
        await this.cacheRepository.updateContestLeaderBoard(
          contestLeaderboardKey,
          submission.userId,
          contestProblemDetail.points,
        );
      }
    }

    return submission;
  }

  async getContestLeaderboard(contestId: string): Promise<any> {
    const leaderboardKey = `contest:${contestId}:leaderboard`;
    const leaderboard =
      await this.cacheRepository.getContestLeaderBoard(leaderboardKey);
    return leaderboard;
  }

  async getSubmissionsByProblemId(
    problemId: string,
    userId: string,
    limit: number = 5,
    page: number = 1,
  ): Promise<{ submissions: ISubmission[]; total: number; page: number }> {
    // ensures page is never < 1
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;

    const result = await this.submissionRepository.findByProblemId(
      problemId,
      userId,
      limit,
      skip,
    );

    return {
      submissions: result.submissions,
      total: result.total,
      page: safePage,
    };
  }

  async deleteSubmissionById(id: string): Promise<boolean> {
    const submission = await this.submissionRepository.findById(id);

    if (!submission) {
      throw new NotFoundError(`Submission with id ${id} not found`);
    }

    return this.submissionRepository.deleteById(id);
  }

  async getRunCodeStatus(id: string) {
    const result = await this.cacheRepository.getRunCodeStatus(`run:${id}`);

    if (!result) {
      throw new NotFoundError("Run code status not found");
    }

    return result;
  }
}
