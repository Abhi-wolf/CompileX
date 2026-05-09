import Redis from "ioredis";
import logger from "../config/logger.config";
import { RunCodeStatus } from "../types/submission.types";
import { redisConnection } from "../config/redis.config";
import { ICachedProblem } from "../types/problem.types";

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
}
