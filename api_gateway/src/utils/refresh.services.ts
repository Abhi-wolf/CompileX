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
  } catch (error) {}
};

export const refreshAllServices = async () => {
  return Promise.all(
    Object.values(KNOWN_SERVICES).map((service) =>
      refreshServices(service.serviceName),
    ),
  );
};

setInterval(() => {
  refreshAllServices();
  logger.info('Initiallly refreshed all services')
}, CACHE_REFRESH_INTERVAL_MS);
