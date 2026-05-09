import { getProblemById } from "../apis/problem.api";
import logger from "../config/logger.config";
import {
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

  private async getProblemWithCache(problemId: string) {
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

  async createContestSubmission(
    submissionData: Partial<ISubmission>,
    userId: string,
  ): Promise<ISubmission> {
    if (!submissionData.contestId) {
      throw new NotFoundError("Contest ID is required");
    }

    const problem = await this.getProblemWithCache(submissionData.problemId!);

    if (!problem) {
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
      testcases: problem.testcases,
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
    const problem = await this.getProblemWithCache(submissionData.problemId!);

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
    submissionData: ISubmissionData,
  ): Promise<ISubmission | null> {
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
