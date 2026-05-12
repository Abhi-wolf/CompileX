import { serverConfig } from ".";
import logger from "./logger.config";
import Redis from "ioredis";

const redisBaseConfig = {
  maxRetriesPerRequest: null,
  retryStrategy(times: number) {
    if (times > 3) {
      logger.error(
        "Unable to connect to Redis server after multiple attempts.",
      );
      return null; // Stop retrying after 3 attempts
    }
    const delay = Math.min(times * 100, 3000); // Exponential backoff with a maximum delay of 3 seconds
    return delay;
  },
};

class RedisConnection {
  private static instance: RedisConnection | null = null;
  private redis: Redis | null;

  private constructor() {
    this.redis = null;
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  async connect(): Promise<Redis> {
    if (this.redis) {
      logger.info("Redis connection already exists");
      return this.redis;
    }

    this.redis = new Redis(serverConfig.REDIS_URL, redisBaseConfig);

    logger.info("Redis connection established");
    return this.redis;
  }

  async getRedisOrConnect(): Promise<Redis> {
    if (this.redis) {
      return this.redis;
    }

    this.redis = new Redis(serverConfig.REDIS_URL, redisBaseConfig);

    return this.redis;
  }

  createNewRedisConnection(): Redis {
    return new Redis(serverConfig.REDIS_URL, redisBaseConfig);
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      logger.info("Redis connection closed");
    }
  }

  async checkRedis(): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const response = await this.redis.ping();
      return response === "PONG";
    } catch (error) {
      return false;
    }
  }
}

export const redisConnection = RedisConnection.getInstance();
