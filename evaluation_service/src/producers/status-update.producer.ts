import { serverConfig } from "../config";
import logger from "../config/logger.config";
import { ISubmissionData } from "../types/evaluation.interface";
import { statusUpdateQueue } from "../queues/status-update.queue";
import { getCorrelationId } from "../utils/helpers/request.helpers";

interface IStatusUpdateProducer {
  submissionId: string;
  status: string;
  output: ISubmissionData[];
  contestId?: string;
}

export async function addStatusUpdateJob(
  data: IStatusUpdateProducer,
): Promise<string | null> {
  try {
    const correlationId = getCorrelationId();

    const jobData = {
      ...data,
      correlationId: correlationId,
    };

    let job = null;

    if (data.contestId) {
      job = await statusUpdateQueue.add(
        serverConfig.CONTEST_SUBMISSION_STATUS_UPDATE_JOB_NAME,
        jobData,
      );
      logger.info(
        `Added contest submission status update job with contest ID: ${data.contestId}, submission ID: ${data.submissionId} and Job ID: ${job.id}`,
      );
    } else {
      job = await statusUpdateQueue.add(
        serverConfig.STATUS_UPDATE_JOB_NAME,
        jobData,
      );
      logger.info(
        `Added status update job with ID: ${job.id} for submission ID: ${data.submissionId}`,
      );
    }

    return job.id || null;
  } catch (error) {
    logger.error(
      `Failed to add status update job for submission ID: ${data.submissionId}`,
      error,
    );
    return null;
  }
}
