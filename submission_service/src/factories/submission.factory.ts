import { SubmissionController } from "../controllers/submission.controller";
import { CacheRepository } from "../repositories/cache.repository";
import { SubmissionRepository } from "../repositories/submission.repository";
import { SubmissionService } from "../services/submission.service";

export class SubmissionFactory {
  private static cacheRepository: CacheRepository;
  private static submissionRepository: SubmissionRepository;
  private static submissionService: SubmissionService;
  private static submissionController: SubmissionController;

  static getCacheRepository(): CacheRepository {
    if (!this.cacheRepository) {
      this.cacheRepository = new CacheRepository();
    }
    return this.cacheRepository;
  }

  static getSubmissionRepository(): SubmissionRepository {
    if (!this.submissionRepository) {
      this.submissionRepository = new SubmissionRepository();
    }
    return this.submissionRepository;
  }

  static getSubmissionService(): SubmissionService {
    if (!this.submissionService) {
      this.submissionService = new SubmissionService(
        this.getSubmissionRepository(),
        this.getCacheRepository(),
      );
    }
    return this.submissionService;
  }

  static getSubmissionController(): SubmissionController {
    if (!this.submissionController) {
      this.submissionController = new SubmissionController(
        this.getSubmissionService(),
      );
    }
    return this.submissionController;
  }
}
