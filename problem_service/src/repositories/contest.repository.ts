import { IContest } from "../models/contest.model";
import { Contest } from "../models/contest.model";

export class ContestRepository {
  async createContest(contest: Partial<IContest>): Promise<IContest | null> {
    return await Contest.create(contest);
  }

  async getContestById(id: string): Promise<IContest | null> {
    return await Contest.findById(id).populate("problems.problemId");
  }

  async updateContest(
    id: string,
    updateData: Partial<IContest>,
  ): Promise<IContest | null> {
    return await Contest.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteContest(id: string): Promise<IContest | null> {
    return await Contest.findByIdAndDelete(id);
  }

  async getAllContests(): Promise<IContest[]> {
    return await Contest.find().select("id name startTime endTime");
  }

  async getContestsByStartTime(startTime: Date): Promise<IContest[]> {
    return await Contest.find({ startTime: { $gte: startTime } }).select(
      "id name startTime endTime",
    );
  }
}
