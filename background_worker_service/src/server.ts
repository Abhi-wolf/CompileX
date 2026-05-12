import logger from "./config/logger.config";
import { problemDB } from "./config/problem.db.config";
import { redisConnection } from "./config/redis.config";
import { startContestLeaderboardWorker } from "./jobs/contestLeaderboard.job";
import { startContestStatusWorker } from "./jobs/updateContestStatus.job";

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received - starting graceful shutdown`);

  try {
    await problemDB.disconnect();
    await redisConnection.disconnect();
    logger.info("All connections closed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

async function bootstrap() {
  try {
    await problemDB.connect();
    await redisConnection.connect();

    startContestLeaderboardWorker();
    startContestStatusWorker();

    logger.info("Contest worker service started");

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    logger.error("Failed to start contest worker service", error);
    process.exit(1);
  }
}

bootstrap();
