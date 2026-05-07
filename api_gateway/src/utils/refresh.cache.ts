import logger from "../config/logger.config";
import { InstanceFactory } from "../factories/instance.factory";

const instanceService = InstanceFactory.getInstanceService();

export function startCacheRefresher() {
  setInterval(() => {
    instanceService.cleanupStaleInstances();
    logger.info("Removed all stale service instances")
  }, 90000); // every 1.5 minutes
}
