import { CacheRepository } from "../repository/cache.repository";
import { EvaluationService } from "../services/evaluation.service";

export class EvaluationFactory {
  private static cacheRepository: CacheRepository;
  private static evaluationService: EvaluationService;

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
}
