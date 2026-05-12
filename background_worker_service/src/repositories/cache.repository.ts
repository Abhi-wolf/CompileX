import Redis from "ioredis";
import { redisConnection } from "../config/redis.config";
import { ICachedContest } from "../types/problem.types";

export class CacheRepository {
  private async getRedis(): Promise<Redis> {
    const redis = await redisConnection.getRedisOrConnect();

    if (!redis) {
      throw new Error("Redis connection is not available");
    }

    return redis;
  }

  async getCachedContest(key: string): Promise<ICachedContest | null> {
    const redis = await this.getRedis();
    const result = await redis.get(key);

    return result ? JSON.parse(result) : null;
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

  async deleteContestLeaderBoard(key: string) {
    const redis = await this.getRedis();
    const result = await redis.del(key);

    return result;
  }
}
