import { EvaluationController } from "../controllers/evaluation.controller";
import { CacheRepository } from "../repository/cache.repository";
import { EvaluationService } from "../services/evaluation.service";

export class EvaluationFactory {
  private static cacheRepository: CacheRepository;
  private static evaluationService: EvaluationService;
  private static evaluationController: EvaluationController;

  static getCacheRepository(): CacheRepository {
    if (!this.cacheRepository) {
      this.cacheRepository = new CacheRepository();
    }
    return this.cacheRepository;
  }

  static getEvaluationService(): EvaluationService {
    if (!this.evaluationService) {
      this.evaluationService = new EvaluationService(this.getCacheRepository());
    }
    return this.evaluationService;
  }

  static getEvaluationController(): EvaluationController {
    if (!this.evaluationController) {
      this.evaluationController = new EvaluationController(
        this.getEvaluationService(),
      );
    }
    return this.evaluationController;
  }
}
