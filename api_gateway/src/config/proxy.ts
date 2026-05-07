import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { InstanceFactory } from "../factories/instance.factory";
import logger from "./logger.config";
import {
  InternalServerError,
  ServiceUnavailableError,
} from "../utils/errors/app.error";
import { generateHMACSignature } from "../utils/generateHMACSignature";
import { serverConfig } from ".";

const instanceService = InstanceFactory.getInstanceService();
const apiGatewayHmacSharedSecret = serverConfig.API_GATEWAY_HMAC_SHARED_SECRET;

const getNextInstance = async (serviceName: string) => {
  // if (serviceName === "auth-service") {
  // const instances = await getServiceInstances(serviceName);

  // console.log(`got ${serviceName} instances = `, instances);

  // if (!instances || instances.length === 0) {
  //   throw new Error("No instances of auth-service found");
  // }

  // return `http://${instances[0].address}:${instances[0].port}`;
  // } else {
  // }
  const nextInstance = instanceService.getNextRoundRobinInstance(serviceName);
  return `http://${nextInstance.address}:${nextInstance.port}`;
};

export const createProxy = (serviceDetail: {
  name: string;
  serviceName: string;
}) => {
  return createProxyMiddleware({
    changeOrigin: true,

    router: async () => {
      try {
        const instance = await getNextInstance(serviceDetail.serviceName);
        logger.debug(
          `Redirecting request to ${instance} instance of ${serviceDetail.serviceName}`,
        );
        return instance;
      } catch (error) {
        // console.error("Error getting next instance:", error);
        throw new ServiceUnavailableError(
          "Service temporarily unavailable. Please try again later.",
        );
      }
    },

    pathRewrite: { "^/": `/api/v1/${serviceDetail.name}/` },

    proxyTimeout: 5000,
    timeout: 5000,

    on: {
      proxyReq: (proxyReq, req: any) => {
        try {
          const timestamp = Date.now().toString();

          const payload = {
            method: req.method,
            path: proxyReq.path,
            timestamp,
            body: req.body || {},
          };

          const signature = generateHMACSignature(
            JSON.stringify(payload),
            apiGatewayHmacSharedSecret,
          );

          const correlationId = req.headers["x-correlation-id"];
          if (correlationId) {
            proxyReq.setHeader("x-correlation-id", correlationId);
          }

          const expressReq = req as any;
          logger.debug(
            `Original request: ${expressReq.originalUrl} -> Transformed to: ${proxyReq.path}`,
          );

          proxyReq.removeHeader("x-api-gateway-signature");
          proxyReq.removeHeader("x-api-gateway-timestamp");

          proxyReq.setHeader("x-api-gateway-signature", signature);
          proxyReq.setHeader("x-api-gateway-timestamp", timestamp.toString());

          fixRequestBody(proxyReq, req);
        } catch (error) {
          logger.error(
            `Error in proxyReq for ${serviceDetail.serviceName}:`,
            error,
          );
          throw new InternalServerError(
            (error as Error).message || "Failed to process request",
          );
        }
      },

      error: (err) => {
        logger.error(
          `Proxy error for ${serviceDetail.serviceName}: ${err.message}`,
        );
      },
    },
  });
};
