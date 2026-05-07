import logger from "../../config/logger.config";
import { consul } from "./consul.client";

export async function getServiceInstances(serviceName: string) {
  try {
    const services = await consul.health.service({
      service: serviceName,
      passing: true,
    });

    return services.map((s: any) => ({
      address: s.Service.Address,
      port: s.Service.Port,
      instanceId: s.Service.ID,
    }));
  } catch (error) {
    logger.error("Error in getServiceInstances from consul:", error);
  }
}
