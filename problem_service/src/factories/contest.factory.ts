import { ContestController } from "../controllers/contest.controller";
import { ContestLeaderboardRepository } from "../repositories/contest.leaderboard.repository";
import { ContestRepository } from "../repositories/contest.repository";
import { ContestService } from "../services/contest.service";

export class ContestFactory {
  private static contestRepository: ContestRepository;
  private static contestService: ContestService;
  private static contestController: ContestController;
  private static contestLeaderboardRepository: ContestLeaderboardRepository;

  static getContestRepository(): ContestRepository {
    if (!this.contestRepository) {
      this.contestRepository = new ContestRepository();
    }
    return this.contestRepository;
  }

  static getContestLeaderboardRepository(): ContestLeaderboardRepository {
    if (!this.contestLeaderboardRepository) {
      this.contestLeaderboardRepository = new ContestLeaderboardRepository();
    }
    return this.contestLeaderboardRepository;
  }

  static getContestService(): ContestService {
    if (!this.contestService) {
      this.contestService = new ContestService(
        this.getContestRepository(),
        this.getContestLeaderboardRepository(),
      );
    }
    return this.contestService;
  }

  static getContestController(): ContestController {
    if (!this.contestController) {
      this.contestController = new ContestController(this.getContestService());
    }
    return this.contestController;
  }
}
