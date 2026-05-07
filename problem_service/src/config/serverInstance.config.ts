import os from "os";
import { serverConfig } from ".";

const systemHost = os.hostname();

export const serverInstance = {
  name: "problem-service",
  id: `problem-service-${systemHost}`,
  address: "problem-service",
  port: serverConfig.PORT,
  check: {
    http: `http://${systemHost}:${serverConfig.PORT}/api/v1/problems/health/consul`,
    name: "problem-service",
    interval: "30s",
    timeout: "5s",
  },
};
