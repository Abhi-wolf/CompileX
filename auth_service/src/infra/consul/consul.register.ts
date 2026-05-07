import logger from "../../config/logger.config";
import { consul } from "./consul.client";

export async function registerServiceInstance(serverConfig: any) {
  try {
    await consul.agent.service.register(serverConfig);
    logger.info(`Service instance registered successfully`, serverConfig);
  } catch (error) {
    console.error("ERROR IN REGISTERING SERVICE INSTANCE : ", error);
  }
}

export async function deregisterServiceInstance(serviceId: string) {
  try {
    await consul.agent.service.deregister(serviceId);
    logger.info(`Service instance deregistered successfully`, serviceId);
  } catch (error) {
    console.error("ERROR IN DEREGISTERING SERVICE INSTANCE : ", error);
  }
}
