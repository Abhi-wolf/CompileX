import { CacheRepository } from "../repository/cache.repository";
import { NotFoundError } from "../utils/errors/app.error";

export class EvaluationService {
  constructor(private cacheRepository: CacheRepository) {}

  async getRunCodeStatus(id: string) {
    const result = await this.cacheRepository.getRunCodeStatus(`run:${id}`);

    console.log("Result from service: ", result);

    if (!result) {
      console.log("Run code status not found thrown NotFoundError");
      throw new NotFoundError("Run code status not found");
    }

    return result;
  }

  async setRunCodeStatus(key: string, value: string) {
    await this.cacheRepository.setRunCodeStatus(key, value);
  }
}
