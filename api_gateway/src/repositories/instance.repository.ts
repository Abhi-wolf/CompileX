import logger from "../config/logger.config";

export interface ServiceInstance {
  instanceId: string;
  address: string;
  port: number;
  lastHeartbeat: Date;
}

export class InstanceRepository {
  private discoveryCache: Map<string, ServiceInstance[]> = new Map();
  private roundRobinCounter: Map<string, number> = new Map();

  addServiceInstanceToCache(
    serviceName: string,
    instanceId: string,
    address: string,
    port: number,
    lastHeartbeat: Date,
  ) {
    const serviceInstances = this.discoveryCache.get(serviceName) || [];

    serviceInstances.push({ instanceId, address, port, lastHeartbeat });

    this.discoveryCache.set(serviceName, serviceInstances);

    logger.info(
      `Added ${serviceName} with instance ${instanceId} to discovery cache`,
    );

    return this.discoveryCache.get(serviceName);
  }

  getAllServicesFromCache() {
    return this.discoveryCache;
  }

  getServiceInstancesFromCache(serviceName: string) {
    return this.discoveryCache.get(serviceName);
  }

  getRoundRobinCounterFromCache(serviceName: string) {
    const counter = this.roundRobinCounter.get(serviceName) || 0;

    return counter;
  }

  setRoundRobinCounterInCache(serviceName: string, counter: number) {
    this.roundRobinCounter.set(serviceName, counter);
  }

  updateLastHeartbeat(serviceName: string, instanceId: string) {
    const serviceInstances = this.discoveryCache.get(serviceName);

    if (serviceInstances) {
      const instance = serviceInstances.find(
        (instance) => instance.instanceId === instanceId,
      );
      if (instance) {
        instance.lastHeartbeat = new Date();
      }
    }
  }

  removeServiceInstanceFromCache(serviceName: string, instanceId: string) {
    const serviceInstances = this.discoveryCache.get(serviceName);

    if (serviceInstances) {
      const instanceIndex = serviceInstances.findIndex(
        (instance) => instance.instanceId === instanceId,
      );
      if (instanceIndex !== -1) {
        serviceInstances.splice(instanceIndex, 1);
        this.discoveryCache.set(serviceName, serviceInstances);
      }
    }
  }
}
