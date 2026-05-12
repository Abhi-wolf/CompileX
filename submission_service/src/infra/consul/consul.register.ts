import logger from "../../config/logger.config";
import { consul } from "./consul.client";

let healthCheckInterval: NodeJS.Timeout | null = null;

function startHealthCheck(serverInstance: any) {
  // only starts after successful registration
  if (healthCheckInterval) return; // prevent duplicate intervals

  healthCheckInterval = setInterval(async () => {
    try {
      const services = await consul.agent.service.list();
      if (!services[serverInstance.id]) {
        logger.warn("Service missing in consul. Re-registering...");
        await consul.agent.service.register(serverInstance);
      }
    } catch (error) {
      logger.error("Consul health check failed", error);
    }
  }, 30000);
}

export async function registerServiceInstance(serverInstance: any) {
  const MAX_RETRIES = 5;
  let attempts = 0;

  const attemptRegistration = async () => {
    try {
      await consul.agent.service.register(serverInstance);
      logger.info(`Service instance registered successfully`, serverInstance);
      // start only after successful registration
      startHealthCheck(serverInstance);
    } catch (error) {
      attempts++;
      if (attempts >= MAX_RETRIES) {
        logger.error(
          `Failed to register after ${MAX_RETRIES} attempts. Giving up.`,
        );
        return;
      }
      logger.error(
        `Failed to register (attempt ${attempts}), retrying in 5s...`,
        error,
      );
      setTimeout(attemptRegistration, 5000);
    }
  };

  attemptRegistration();
}

export async function deregisterServiceInstance(serviceId: string) {
  try {
    // stop health check before deregistering
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
    await consul.agent.service.deregister(serviceId);
    logger.info(`Service instance deregistered successfully`, serviceId);
  } catch (error) {
    logger.error(`Failed to deregister service instance`, error);
  }
}
