import { ContestController } from "../controllers/contest.controller";
import { ContestRepository } from "../repositories/contest.repository";
import { ContestService } from "../services/contest.service";

export class ContestFactory {
  private static contestRepository: ContestRepository;
  private static contestService: ContestService;
  private static contestController: ContestController;

  static getContestRepository(): ContestRepository {
    if (!this.contestRepository) {
      this.contestRepository = new ContestRepository();
    }
    return this.contestRepository;
  }

  static getContestService(): ContestService {
    if (!this.contestService) {
      this.contestService = new ContestService(this.getContestRepository());
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
