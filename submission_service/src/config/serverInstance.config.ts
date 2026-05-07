import os from "os";
import { serverConfig } from ".";

const systemHost = os.hostname();

export const serverInstance = {
  name: "submission-service",
  id: `submission-service-${systemHost}`,
  address: "submission-service",
  port: serverConfig.PORT,
  check: {
    http: `http://${systemHost}:${serverConfig.PORT}/api/v1/submissions/health/consul`,
    name: "submission-service",
    interval: "30s",
    timeout: "5s",
  },
};
