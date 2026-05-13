import { InstanceRepository } from "../repositories/instance.repository";
import { InstanceService } from "../services/instance.service";

export class InstanceFactory {
  private static instanceRepository: InstanceRepository;
  private static instanceService: InstanceService;

  static getInstanceRepository(): InstanceRepository {
    if (!this.instanceRepository) {
      this.instanceRepository = new InstanceRepository();
    }
    return this.instanceRepository;
  }

  static getInstanceService(): InstanceService {
    if (!this.instanceService) {
      this.instanceService = new InstanceService(this.getInstanceRepository());
    }
    return this.instanceService;
  }
}
