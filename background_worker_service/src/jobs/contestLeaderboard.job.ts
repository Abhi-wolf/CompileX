import cron from "node-cron";
import logger from "../config/logger.config";
import { ContestService } from "../services/contest.service";
import { ContestRepository } from "../repositories/contest.repository";
import { ContestLeaderboardRepository } from "../repositories/contest.leaderboard.repository";
import { CacheRepository } from "../repositories/cache.repository";

const contestService = new ContestService(
  new ContestRepository(),
  new ContestLeaderboardRepository(),
  new CacheRepository(),
);

export function startContestLeaderboardWorker() {
  /**
   * Runs every 5 minutes
   */
  cron.schedule("*/5 * * * *", async () => {
    logger.info("Running contest leaderboard worker");

    await contestService.updateContestLeaderboard();
  });
}
