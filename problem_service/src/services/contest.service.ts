import { ContestRepository } from "../repositories/contest.repository";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error";
import { CreateContestDto } from "../validators/contest.validator";

export class ContestService {
  private contestRepository: ContestRepository;

  constructor(contestRepository: ContestRepository) {
    this.contestRepository = contestRepository;
  }

  async createContest(contest: CreateContestDto) {
    if (contest.startTime < new Date()) {
      throw new Error("Start time must be in the future");
    }

    if (
      contest.startTime >= contest.endTime ||
      new Date(contest.endTime).getTime() -
        new Date(contest.startTime).getTime() >
        3 * 60 * 60 * 1000
    ) {
      throw new Error(
        "Start time must be before end time and duration must be less than or equal to 3 hours",
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
    console.log("Getting upcoming contests", startTime);

    const allContests = await this.contestRepository.getAllContests();
    console.log("All contests", allContests);

    const contests =
      await this.contestRepository.getContestsByStartTime(startTime);

    console.log("Upcoming contests", contests);
    return contests;
  }
}
