import logger from "../config/logger.config";
import { ContestRepository } from "../repositories/contest.repository";
import { ContestStatus } from "../models/contest.model";
import { ContestLeaderboardRepository } from "../repositories/contest.leaderboard.repository";
import { CacheRepository } from "../repositories/cache.repository";

export class ContestService {
  constructor(
    private contestRepository: ContestRepository,
    private contestLeaderboardRepository: ContestLeaderboardRepository,
    private cacheRepository: CacheRepository,
  ) {}

  async updateActiveContestStatus() {
    const currentTime = new Date();

    const contests =
      await this.contestRepository.getContestsWhichHasStarted(currentTime);

    const statusNotUpdated = contests.filter(
      (contest) =>
        contest.status !== ContestStatus.ACTIVE &&
        contest.endTime > currentTime,
    );

    if (statusNotUpdated.length === 0) {
      logger.info("No contests to update active status");
      return;
    }

    logger.info(`Contests which has started: ${statusNotUpdated.length}`);

    // change the status of contests to ACTIVE
    const contestIds = statusNotUpdated.map((contest) => contest.id);

    await this.contestRepository.bulkUpdateContestStatus(
      contestIds,
      ContestStatus.ACTIVE,
    );

    logger.info(`Contests which has started: ${statusNotUpdated.length}`);
  }

  async updateFinishedContestStatus() {
    const currentTime = new Date();

    const twelveHoursAgo = new Date(
      currentTime.getTime() - 12 * 60 * 60 * 1000,
    );

    const contests =
      await this.contestRepository.getContestsWhichHasEndedBetween(
        twelveHoursAgo,
        currentTime,
      );

    const statusNotUpdated = contests.filter(
      (contest) =>
        contest.status !== ContestStatus.FINISHED &&
        contest.endTime < currentTime,
    );

    if (statusNotUpdated.length === 0) {
      logger.info("No contests to update finished status");
      return;
    }

    logger.info(`Contests which has ended: ${statusNotUpdated.length}`);

    // change the status of contests to FINISHED
    const contestIds = statusNotUpdated.map((contest) => contest.id);

    await this.contestRepository.bulkUpdateContestStatus(
      contestIds,
      ContestStatus.FINISHED,
    );

    logger.info(`Contests which has ended: ${statusNotUpdated.length}`);
  }

  async updateContestLeaderboard() {
    // find contest which has ended in last 12 hours
    const currentTime = new Date();

    const twelveHoursAgo = new Date(
      currentTime.getTime() - 12 * 60 * 60 * 1000,
    );

    const contests =
      await this.contestRepository.getContestsWhichHasEndedBetween(
        twelveHoursAgo,
        currentTime,
      );

    if (contests.length === 0) {
      logger.info("No contests to update leaderboard");
      return;
    }

    logger.info(
      `Contests which has ended in last 12 hours: ${contests.length}`,
    );

    // update leaderboard for each contest
    for (const contest of contests) {
      const contestLeaderboardKey = `contest:${contest.id}:leaderboard`;

      const leaderboard = await this.cacheRepository.getContestLeaderBoard(
        contestLeaderboardKey,
      );

      if (!leaderboard || leaderboard.length === 0) {
        logger.info(`Leaderboard not found for contest: ${contest.id}`);
        continue;
      }

      // update the leaderboard in database
      const result =
        await this.contestLeaderboardRepository.updateContestLeaderboard(
          contest.id,
          leaderboard,
        );

      if (!result) {
        logger.error(`Failed to update leaderboard for contest: ${contest.id}`);
        continue;
      }

      if (contest.endTime < currentTime) {
        const deleteResult =
          await this.cacheRepository.deleteContestLeaderBoard(
            contestLeaderboardKey,
          );
        logger.info(
          `Deleted leaderboard for contest: ${contest.id}, result: ${deleteResult}`,
        );
      }

      logger.info(`Updated leaderboard for contest: ${contest.id}`);
    }
  }
}
