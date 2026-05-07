import os from "os";
import { serverConfig } from ".";

const systemHost = os.hostname();

export const serverInstance = {
  name: "auth-service",
  id: `auth-service-${systemHost}`,
  address: "auth-service",
  port: serverConfig.PORT,
  check: {
    http: `http://${systemHost}:${serverConfig.PORT}/api/v1/auth/health/consul`,
    name: "auth-service",
    interval: "30s",
    timeout: "5s",
  },
};
