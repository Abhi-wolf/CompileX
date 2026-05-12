import { Worker } from "bullmq";
import { serverConfig } from "../config";
import { asyncLocalStorage } from "../utils/helpers/request.helpers";
import logger from "../config/logger.config";
import { SubmissionFactory } from "../factories/submission.factory";
import { redisConnection } from "../config/redis.config";

const submissionService = SubmissionFactory.getSubmissionService();

let statusUpdateWorker: Worker | null = null;

async function setupStatusUpdateWorker() {
  statusUpdateWorker = new Worker(
    serverConfig.STATUS_UPDATE_QUEUE_NAME,
    async (job) => {
      return asyncLocalStorage.run(
        { correlationId: job.data.correlationId },
        async () => {
          // Only process status update jobs in this worker
          if (job.name === serverConfig.STATUS_UPDATE_JOB_NAME) {
            logger.info(
              `Processing status update job ${job.id} for submission ID: ${job.data.submissionId}`,
            );
            const data = job.data;

            try {
              await submissionService.updateSubmissionStatus(
                data.submissionId,
                data.status,
                data.output,
              );

              logger.info(
                `Status update job ${job.id} processed successfully for submission ID: ${data.submissionId}`,
              );
            } catch (error) {
              logger.error(`Error processing job ${job.id}:`, error);
              throw error;
            }
          } else if (job.name === serverConfig.CONTEST_SUBMISSION_STATUS_UPDATE_JOB_NAME) {
            logger.info(
              `Processing contest submission status update job ${job.id} for submission ID: ${job.data.submissionId}`,
            );
            const data = job.data;

            try {
              await submissionService.updateContestSubmissionStatus(
                data.contestId,
                data.submissionId,
                data.status,
                data.output,
              );

              logger.info(
                `Contest submission status update job ${job.id} processed successfully for submission ID: ${data.submissionId}`,
              );
            } catch (error) {
              logger.error(`Error processing contest submission status update job ${job.id}:`, error);
              throw error;
            }
          }
        },
      );
    },
    {
      connection: redisConnection.createNewRedisConnection(),
      concurrency: 10,
    },
  );

  statusUpdateWorker.on("error", (error) => {
    logger.error("Status update worker error:", error);
  });

  statusUpdateWorker.on("failed", (job, error) => {
    logger.error(`Status update job ${job?.id} failed with error:`, error);
  });
}

export async function startStatusUpdateWorkers() {
  await setupStatusUpdateWorker();
  logger.info("Status update worker started");
}

export async function stopStatusUpdateWorkers() {
  if (statusUpdateWorker) {
    logger.info("Stopping status update worker...");
    await statusUpdateWorker.close();
    statusUpdateWorker = null;
    logger.info("Status update worker stopped");
  }
}
