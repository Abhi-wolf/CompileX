import logger from "../config/logger.config";
import { InstanceRepository } from "../repositories/instance.repository";
import { BadRequestError } from "../utils/errors/app.error";

interface ServiceInstance {
  instanceId: string;
  address: string;
  port: number;
}

export class InstanceService {
  private readonly HEARTBEAT_TIMEOUT = 120_000; // 2 minutes
  constructor(private serviceInstanceRepository: InstanceRepository) {}

  private verifyServiceSignature() {
    return true;
  }

  cleanupStaleInstances() {
    const now = Date.now();

    const allServices =
      this.serviceInstanceRepository.getAllServicesFromCache();

    for (const [serviceName, instances] of allServices.entries()) {

      const staleInstances = instances.filter(
        (instance) =>
          now - new Date(instance.lastHeartbeat).getTime() >
          this.HEARTBEAT_TIMEOUT,
      );

      for (const instance of staleInstances) {
        this.serviceInstanceRepository.removeServiceInstanceFromCache(
          serviceName,
          instance.instanceId,
        );
      }

      logger.debug(
        `Refreshed ${serviceName}: ${staleInstances.length} inactive instances removed`,
      );
    }
  }

  addServiceInstanceToCache(
    serviceName: string,
    serviceInstance: ServiceInstance[],
  ) {
    const isSignatureValid = this.verifyServiceSignature();

    if (!isSignatureValid) {
      throw new BadRequestError("Invalid service signature");
    }

    let result = [];

    const serviceInstances =
      this.serviceInstanceRepository.getServiceInstancesFromCache(serviceName);

    let addedInstances: number = 0;

    for (const instance of serviceInstance) {
      const isAlreadyPresent = serviceInstances?.some(
        (cached) => cached.instanceId === instance.instanceId,
      );

      if (isAlreadyPresent) {
        // throw new BadRequestError("Service Instance already registered");
        this.serviceInstanceRepository.updateLastHeartbeat(
          serviceName,
          instance.instanceId,
        );

        logger.debug(
          `Instance ${instance.instanceId} of ${serviceName} was already present in the cache updated the last heartbeat`,
        );
        
        continue;
      }

      const lastHeartbeat = new Date();

      const res = this.serviceInstanceRepository.addServiceInstanceToCache(
        serviceName,
        instance.instanceId,
        instance.address,
        instance.port,
        lastHeartbeat,
      );

      addedInstances++;

      result.push(res);
    }

    // console.log(
    //   `RESULT AFTER ADDING ALL THE INSTANCES OF ${serviceName} to cache : `,
    //   this.serviceInstanceRepository.getAllServicesFromCache(),
    // );

    logger.debug(
      `Added ${addedInstances} new instances and updated ${serviceInstance.length - addedInstances} existing instances of ${serviceName}`,
    );
    return result;
  }

  getAllServicesFromCache() {
    const result = this.serviceInstanceRepository.getAllServicesFromCache();

    const services: Record<string, any> = {};

    result.forEach((value, key) => {
      services[key] = value;
    });

    return services;
  }

  getServiceInstancesFromCache(serviceName: string) {
    const instances =
      this.serviceInstanceRepository.getServiceInstancesFromCache(serviceName);

    logger.debug(
      `Total service instances for ${serviceName}: ${instances?.length}`,
    );
    return instances;
  }

  getNextRoundRobinInstance(serviceName: string) {
    const serviceInstances =
      this.serviceInstanceRepository.getServiceInstancesFromCache(serviceName);

    logger.debug(
      `Total service instances for ${serviceName}: ${serviceInstances?.length}`,
    );

    if (!serviceInstances || serviceInstances.length === 0) {
      throw new BadRequestError("No service instances found");
    }

    const counter =
      this.serviceInstanceRepository.getRoundRobinCounterFromCache(
        serviceName,
      ) || 0;

    logger.debug(
      `Getting round robin instance for ${serviceName} with counter ${counter}`,
    );

    const instance = serviceInstances[counter % serviceInstances.length];

    this.serviceInstanceRepository.setRoundRobinCounterInCache(
      serviceName,
      counter + 1,
    );

    logger.info(`Returning instance ${instance.instanceId} for ${serviceName}`);

    return instance;
  }
}
