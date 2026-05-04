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

  // async getRunCodeStatus(key: string): Promise<RunCodeStatus[] | null> {
  async getRunCodeStatus(key: string): Promise<any> {
    console.log("Getting run code status from cache for key: ", key);
    const redis = await this.getRedis();
    console.log("Redis connection established");
    const result = await redis.get(key);
    console.log("Result from cache: ", result);

    return result ? JSON.parse(result) : null;
  }

  async setRunCodeStatus(key: string, value: string): Promise<void> {
    const redis = await this.getRedis();

    await redis.set(key, value);
    await redis.expire(key, 60 * 60); // 1 hour
    logger.info("Run code status set in cache for key: ", key);
  }
}
