import { IProblemDetails } from "../apis/problem.api";
import { serverConfig } from "../config";
import logger from "../config/logger.config";
import { SubmissionLanguage } from "../models/submission.model";
import { submissionQueue } from "../queues/submission.queue";
import { getCorrelationId } from "../utils/helpers/request.helpers";

export interface ISubmissionJob {
  submissionId: string;
  problem: IProblemDetails | null;
  code: string;
  language: SubmissionLanguage;
}

export async function addSubmissionJob(
  data: ISubmissionJob,
  name?: string,
): Promise<string | null> {
  try {
    const correlationId = getCorrelationId();

    const jobData = {
      ...data,
      correlationId: correlationId,
    };

    const jobName = name ? name : serverConfig.EVALUATION_JOB_NAME;

    const job = await submissionQueue.add(jobName, jobData);

    logger.info(
      `Added submission job with ID: ${job.id} for submission ID: ${data.submissionId}`,
    );

    return job.id || null;
  } catch (error) {
    logger.error(
      `Failed to add submission job for submission ID: ${data.submissionId}, error:`,
      error,
    );
    return null;
  }
}
