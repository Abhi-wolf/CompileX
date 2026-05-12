import { ContestLeaderboard } from "../models/contest.leaderboard.model";

export class ContestLeaderboardRepository {
  async getContestLeaderboard(contestId: string) {
    const leaderboard = await ContestLeaderboard.findOne({ contestId });
    return leaderboard;
  }
}
