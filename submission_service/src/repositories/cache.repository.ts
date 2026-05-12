import Redis from "ioredis";
import logger from "../config/logger.config";
import { RunCodeStatus } from "../types/submission.types";
import { redisConnection } from "../config/redis.config";
import { ICachedContest, ICachedProblem } from "../types/problem.types";

export class CacheRepository {
  private async getRedis(): Promise<Redis> {
    const redis = await redisConnection.getRedisOrConnect();

    if (!redis) {
      throw new Error("Redis connection is not available");
    }

    return redis;
  }

  async getRunCodeStatus(key: string): Promise<RunCodeStatus[] | null> {
    const redis = await this.getRedis();
    const result = await redis.get(key);

    return result ? JSON.parse(result) : null;
  }

  async setRunCodeStatus(key: string, value: string): Promise<void> {
    const redis = await this.getRedis();

    await redis.set(key, value);
    await redis.expire(key, 60 * 60); // 1 hour
    logger.info("Run code status set in cache for key: ", key);
  }

  async getCachedProblem(key: string): Promise<ICachedProblem | null> {
    const redis = await this.getRedis();
    const result = await redis.get(key);

    return result ? JSON.parse(result) : null;
  }

  async setCachedProblem(key: string, value: ICachedProblem): Promise<void> {
    const redis = await this.getRedis();

    await redis.set(key, JSON.stringify(value));
    await redis.expire(key, 3 * 60 * 60); // 3 hour
    logger.info("Problem cached in cache for key: ", key);
  }

  async getCachedContest(key: string): Promise<ICachedContest | null> {
    const redis = await this.getRedis();
    const result = await redis.get(key);

    return result ? JSON.parse(result) : null;
  }

  async setCachedContest(key: string, value: ICachedContest): Promise<void> {
    const redis = await this.getRedis();

    const currentTime = Date.now();
    const contestEndTime = Date.parse(value.endTime.toString());

    // console.log("currentTime", currentTime);
    // console.log("contestEndTime", contestEndTime);

    const expiryTime = Math.min(3 * 60 * 60, contestEndTime - currentTime); // 3 hour

    // console.log("expiryTime", expiryTime);

    await redis.set(key, JSON.stringify(value));

    await redis.expire(key, expiryTime);
    logger.info("Contest cached in cache for key: ", key);
  }

  async updateContestLeaderBoard(key: string, userId: string, score: number) {
    const redis = await this.getRedis();
    const rank = await redis.zrank(key, userId);

    if (rank === null) {
      await redis.zadd(key, score, userId);
      logger.info(
        `Added new user with score to leaderboard key:${key}, userId:${userId}, score:${score}`,
      );
    } else {
      await redis.zincrby(key, score, userId);
      logger.info(
        `Updated user score in leaderboard key:${key}, userId:${userId}, score:${score}`,
      );
    }
  }

  async getContestLeaderBoard(key: string) {
    const redis = await this.getRedis();
    const result = await redis.zrevrange(key, 0, -1, "WITHSCORES");

    const leaderboard = [];

    for (let i = 0; i < result.length; i += 2) {
      leaderboard.push({
        userId: result[i],
        score: Number(result[i + 1]),
        rank: i / 2 + 1,
      });
    }

    return leaderboard;
  }

  async contestSubmissionExists(
    key: string,
    problemId: string,
  ): Promise<boolean> {
    const redis = await this.getRedis();
    const result = await redis.sismember(key, problemId);
    logger.info(
      `contest submission exists key:${key}, problemId:${problemId}, result:${result}`,
    );
    return result === 1;
  }

  async addContestSubmission(key: string, problemId: string): Promise<Boolean> {
    const redis = await this.getRedis();
    const result = await redis.sadd(key, problemId);
    logger.info(
      `addContestSubmission key:${key}, problemId:${problemId}, wasNew:${result === 1}`,
    );
    return result === 1;
  }
}
