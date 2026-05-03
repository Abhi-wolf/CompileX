import Redis from "ioredis";
// import { RunCodeStatus } from "../types/runCode.types";
import { redisConnection } from "../config/redis.config";
import logger from "../config/logger.config";

export class CacheRepository {
  private async getRedis(): Promise<Redis> {
    const redis = await redisConnection.getRedisOrConnect();

    if (!redis) {
      throw new Error("Redis connection is not available");
    }

    return redis;
  }

  async setRunCodeStatus(key: string, value: string): Promise<void> {
    const redis = await this.getRedis();

    await redis.set(key, value);
    await redis.expire(key, 60 * 60); // 1 hour
    logger.info("Run code status set in cache for key: ", key);
  }
}
