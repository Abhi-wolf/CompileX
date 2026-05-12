import {
  ContestLeaderboard,
  IContestLeaderboardUser,
} from "../models/contest.leaderboard.model";

export class ContestLeaderboardRepository {
  async updateContestLeaderboard(
    contestId: string,
    leaderboard: IContestLeaderboardUser[],
  ) {
    const result = await ContestLeaderboard.findOneAndUpdate(
      {
        contestId,
      },
      {
        leaderboard: leaderboard,
      },
      {
        upsert: true,
        new: true,
      },
    );
    return result;
  }
}
