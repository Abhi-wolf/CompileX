import axios from "axios";
import { serverConfig } from "../config";
import logger from "../config/logger.config";
import { KNOWN_SERVICES } from "../config/servicesInfos";
import { InstanceFactory } from "../factories/instance.factory";
import { generateHMACSignature } from "./generateHMACSignature";

const CACHE_REFRESH_INTERVAL_MS = 90000;

const instanceService = InstanceFactory.getInstanceService();

const refreshServices = async (serviceName: string) => {
  try {
    const timestamp = Date.now();
    const nonce = crypto.randomUUID();

    const data={
      timestamp,
      nonce,
      serviceName: serverConfig.SERVICE_NAME,
    }

    const signature = generateHMACSignature(
      JSON.stringify(data),
      serverConfig.REGISTRY_HMAC_SHARED_SECRET,
    );

    // console.log("Data=", data);
    // console.log("Signature=", signature);

    const res = await axios.post(
      `${serverConfig.REGISTRY_SERVICE_URL}/service-registry/discover/${serviceName}`,
      data,
      {
        timeout: 5000,
        headers: {
          "x-registry-signature": signature,
        },
      },
    );

    logger.info(`Refreshed service: ${serviceName}`);

    if (res.data.success) {
      instanceService.addServiceInstanceToCache(serviceName, res.data.data);
    }

    return res.data;
  } catch (error: any) {
    // console.error("refreshServices = ", error);
    logger.error(`Failed to refresh service: ${serviceName} ${error.message}`);
  }
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
}, CACHE_REFRESH_INTERVAL_MS);
