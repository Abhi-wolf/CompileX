import { ContestLeaderboardRepository } from "../repositories/contest.leaderboard.repository";
import { ContestRepository } from "../repositories/contest.repository";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error";
import { CreateContestDto } from "../validators/contest.validator";

export class ContestService {
  private contestRepository: ContestRepository;
  private contestLeaderboardRepository: ContestLeaderboardRepository;

  constructor(
    contestRepository: ContestRepository,
    contestLeaderboardRepository: ContestLeaderboardRepository,
  ) {
    this.contestRepository = contestRepository;
    this.contestLeaderboardRepository = contestLeaderboardRepository;
  }

  async createContest(contest: CreateContestDto) {
    console.log("CONTEST DETAILS=", contest);

    if (
      contest.startTime >= contest.endTime ||
      new Date(contest.endTime).getTime() -
        new Date(contest.startTime).getTime() >
        3 * 60 * 60 * 1000
    ) {
      throw new BadRequestError(
        "Start time must be before end time and duration must be less than or equal to 3 hours",
      );
    }

    if (
      new Date(contest.startTime) < new Date() ||
      new Date(contest.endTime) < new Date()
    ) {
      throw new BadRequestError(
        "Start time and end time must be in the future",
      );
    }

    return await this.contestRepository.createContest(contest);
  }

  async getContest(id: string) {
    const startTime = new Date();

    const contest = await this.contestRepository.getContestById(id);

    if (!contest) {
      throw new NotFoundError("Contest not found");
    }

    if (contest.startTime > startTime) {
      throw new BadRequestError("Contest has not started yet");
    }

    if (contest.endTime < startTime) {
      throw new BadRequestError("Contest has ended");
    }

    return contest;
  }

  async getAllContests() {
    return await this.contestRepository.getAllContests();
  }

  async getUpcomingContests() {
    const startTime = new Date();

    const contests =
      await this.contestRepository.getContestsByStartTime(startTime);

    return contests;
  }

  async getContestLeaderboard(contestId: string) {
    return await this.contestLeaderboardRepository.getContestLeaderboard(
      contestId,
    );
  }

  async deleteContest(id: string) {
    // only upcoming contests can be deleted
    const contest = await this.contestRepository.getContestById(id);

    if (!contest) {
      throw new NotFoundError("Contest not found");
    }
    if (contest.startTime < new Date()) {
      throw new BadRequestError("Contest has already started");
    }

    return await this.contestRepository.deleteContest(id);
  }
}
