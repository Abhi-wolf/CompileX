import express, { Request, Response } from "express";
import { mongoConnection } from "../../config/db.config";
import { serverConfig } from "../../config";

const healthRouter = express.Router();

healthRouter.get("/", async (req: Request, res: Response) => {
  const checks = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: formatUptime(process.uptime()),
    service: serverConfig.SERVICE_NAME || "submission-service",
  };

  const dbHealthy = await mongoConnection.checkDatabase();

  if (!dbHealthy) {
    res.status(503).json({
      ...checks,
      status: "unhealthy",
      dependencies: { db: dbHealthy },
    });
    return;
  }

  res.status(200).json({
    ...checks,
    dependencies: { db: true },
  });
});


healthRouter.get("/consul", async (req: Request, res: Response) => {
  const checks = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: formatUptime(process.uptime()),
    service: serverConfig.SERVICE_NAME || "auth-service",
  };

  res.status(200).json({
    ...checks,
    success: true,
  });
});

export default healthRouter;

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
};
