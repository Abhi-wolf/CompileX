import { v4 as uuidV4 } from "uuid";
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
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../utils/errors/app.error";
import { CacheRepository } from "../repositories/cache.repository";

export interface ISubmissionService {
  createSubmission(
    submissionData: Partial<ISubmission>,
    userId: string,
  ): Promise<ISubmission>;
  getSubmissionById(id: string): Promise<ISubmission | null>;
  updateSubmissionStatus(
    id: string,
    status: SubmissionStatus,
    submissionData?: ISubmissionData,
  ): Promise<ISubmission | null>;
  getSubmissionsByProblemId(
    problemId: string,
    userId: string,
    limit?: number,
    page?: number,
  ): Promise<{ submissions: ISubmission[]; total: number; page: number }>;
  deleteSubmissionById(id: string): Promise<boolean>;
}

export class SubmissionService implements ISubmissionService {
  private submissionRepository: ISubmissionRepository;
  private cacheRepository: CacheRepository;

  constructor(
    submissionRepository: ISubmissionRepository,
    cacheRepository: CacheRepository,
  ) {
    this.submissionRepository = submissionRepository;
    this.cacheRepository = cacheRepository;
  }

  async createSubmission(
    submissionData: Partial<ISubmission>,
    userId: string,
  ): Promise<ISubmission> {
    // check if the problem exists
    if (!submissionData.problemId) {
      throw new BadRequestError(`Problem ID is required`);
    }
    if (!submissionData.code) {
      throw new BadRequestError(`Code is required`);
    }
    if (!submissionData.language) {
      throw new BadRequestError(`Language is required`);
    }

    // get problem details from problem service
    const problem = await getProblemById(submissionData.problemId);

    logger.info(`fetched problem from problem service with id ${problem?.id}`);

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

    //   submission to redis queue for processing
    const jobId = await addSubmissionJob({
      submissionId: submission.id.toString(),
      problem,
      code: submissionData.code,
      language: submissionData.language,
    });

    //  if job is not added to queue, throw an error
    if (jobId) {
      logger.info(`Submission job added to queue with job ID: ${jobId}`);
    } else {
      logger.error(
        `Failed to add submission job for submission ID: ${submission.id}`,
      );

      // mark the submission as failed
      await this.submissionRepository.updateStatus(
        submission.id.toString(),
        SubmissionStatus.FAILED,
      );

      throw new InternalServerError(
        `Failed to add submission job for submission ID: ${submission.id}`,
      );
    }

    return submission;
  }

  async createRun(submissionData: Partial<any>, userId: string): Promise<any> {
    if (!submissionData.problemId) {
      throw new BadRequestError(`Problem ID is required`);
    }
    if (!submissionData.code) {
      throw new BadRequestError(`Code is required`);
    }
    if (!submissionData.language) {
      throw new BadRequestError(`Language is required`);
    }

    //   add the submission payload to the database
    // const submission = await this.submissionRepository.create(
    //   submissionData,
    //   userId,
    // );

    const jobData = {
      submissionId: uuidV4(), // Will be updated by the worker
      problem: null,
      code: submissionData.code,
      language: submissionData.language,
      testcases: submissionData.testcases,
    };

    //   submission to redis queue for processing
    const jobId = await addSubmissionJob(jobData, "RUN_CODE");
    console.log("Job ID:", jobId);

    const cacheKey = `run:${jobData.submissionId}`;
    await this.cacheRepository.setRunCodeStatus(
      cacheKey,
      JSON.stringify({ status: "pending" }),
    );

    logger.info(`Run code status set in cache with key: ${cacheKey}`);

    //  if job is not added to queue, throw an error
    if (jobId) {
      logger.info(`Run job added to queue with job ID: ${jobId}`);
    } else {
      logger.error(`Failed to add run job for run ID: ${jobData.submissionId}`);

      // // mark the submission as failed
      // await this.submissionRepository.updateStatus(
      //   submission.id.toString(),
      //   SubmissionStatus.FAILED,
      // );

      throw new InternalServerError(
        `Failed to add run job for run ID: temp-id`,
      );
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
      updatedAt: new Date(),
    } as any;
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
}
