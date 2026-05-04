import logger from "../config/logger.config";
import { submissionQueue } from "../queues/submission.queue";
import { ISubmissionJob } from "../types/submission.types";
import {
  InternalServerError,
  QueueOverloadError,
} from "../utils/errors/app.error";
import { getCorrelationId } from "../utils/helpers/request.helpers";

export async function addSubmissionJob(
  data: ISubmissionJob,
  name: string,
): Promise<string | null> {
  try {
    const waitingJobs = await submissionQueue.getWaiting();

    if (waitingJobs.length >= 400) {
      logger.warn(
        `Queue is overloaded with ${waitingJobs.length} waiting jobs`,
      );
      throw new QueueOverloadError(
        "System is overloaded. Please try again later.",
      );
    }

    const correlationId = getCorrelationId();

    const jobData = {
      ...data,
      correlationId: correlationId,
    };

    const job = await submissionQueue.add(name, jobData);

    logger.info(
      `Added ${name} job with ID: ${job.id} for submission ID: ${data.submissionId}`,
    );

    return job.id || null;
  } catch (error) {
    logger.error(
      `Failed to add submission job for submission ID: ${data.submissionId}, error:`,
      error,
    );
    if (error instanceof QueueOverloadError) throw error;

    throw new InternalServerError("Queue push failed");
  }
}
