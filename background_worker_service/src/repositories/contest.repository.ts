import { IContestLeaderboard } from "../models/contest.leaderboard.model";
import { ContestStatus, IContest } from "../models/contest.model";
import { Contest } from "../models/contest.model";

export class ContestRepository {
  async getContestById(id: string): Promise<IContest | null> {
    return await Contest.findById(id);
  }

  async updateContestStatus(
    id: string,
    status: ContestStatus,
  ): Promise<IContest | null> {
    return await Contest.findByIdAndUpdate(id, { status }, { new: true });
  }

  async getContestsWhichHasStarted(startTime: Date): Promise<IContest[]> {
    return await Contest.find({ startTime: { $lte: startTime } });
  }

  async getContestsWhichHasEnded(endTime: Date): Promise<IContest[]> {
    return await Contest.find({ endTime: { $lte: endTime } });
  }

    async getContestsWhichHasEndedBetween(
    startTime: Date,
    endTime: Date,
  ): Promise<IContest[]> {
    return await Contest.find({
      endTime: { $gte: startTime, $lte: endTime },
    });
  }

  async updateContestLeaderboard(
    contestId: string,
    leaderboard: IContestLeaderboard[],
  ) {
    return await Contest.findByIdAndUpdate(
      contestId,
      { leaderboard },
      { new: true },
    );
  }

  async bulkUpdateContestStatus(
    contestIds: string[],
    status: ContestStatus,
  ): Promise<any> {
    return await Contest.updateMany({ _id: { $in: contestIds } }, { status });
  }


}
