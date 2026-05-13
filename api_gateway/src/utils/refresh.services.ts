import logger from "../config/logger.config";
import { KNOWN_SERVICES } from "../config/servicesInfos";
import { InstanceFactory } from "../factories/instance.factory";
import { getServiceInstances } from "../infra/consul/getServiceInstances";

const CACHE_REFRESH_INTERVAL_MS = 30000;

const instanceService = InstanceFactory.getInstanceService();

const refreshServices = async (serviceName: string) => {
  try {
    const instances = await getServiceInstances(serviceName);

    if (instances && instances.length > 0) {
      instanceService.addServiceInstanceToCache(serviceName, instances);
    }
  } catch (error: any) {
    logger.error(`Error refreshing service ${serviceName}:`);
    // logger.error({
    //   message: `Error refreshing service ${serviceName}`,
    //   error: error.message,
    //   stack: error.stack,
    // });
  }
};

export const initializeServices = async () => {
  return Promise.all(
    Object.values(KNOWN_SERVICES).map((service) =>
      refreshServices(service.serviceName),
    ),
  );
};

export function startCacheRefresher() {
  setInterval(() => {
    initializeServices();
    logger.info("Refreshed all services");
  }, CACHE_REFRESH_INTERVAL_MS);
}

export function removeStaleInstancesInterval() {
  setInterval(() => {
    instanceService.cleanupStaleInstances();
    logger.info("Removed all stale service instances");
  }, 90000); // every 1.5 minutes
}
