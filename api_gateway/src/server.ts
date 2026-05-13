import express, { Request, Response } from "express";
import { serverConfig } from "./config";
import v1Router from "./routers/v1/index.router";
import {
  appErrorHandler,
  genericErrorHandler,
} from "./middlewares/error.middleware";
import logger from "./config/logger.config";
import { attachCorrelationIdMiddleware } from "./middlewares/correlation.middleware";
import morganMiddleware from "./middlewares/morgan.middleware";
import { createProxy } from "./config/proxy";
// import { refreshAllServices } from "./utils/refresh.services";
// import { startCacheRefresher } from "./utils/refresh.cache";
import { authorize } from "./middlewares/authorization.middleware";
import helmet from "helmet";
import cors from "cors";
import {
  initializeServices,
  removeStaleInstancesInterval,
  startCacheRefresher,
} from "./utils/refresh.services";

const app = express();

// app.use(express.json());

/**
 * Registering all the routers and their corresponding routes with out app server object.
 */

app.use(attachCorrelationIdMiddleware);
app.use(morganMiddleware);

app.use(express.json());

app.use(helmet());

app.use(
  cors({
    origin: [serverConfig.FRONTEND_URL],
  }),
);

app.use("/api", v1Router);

app.use(
  "/api/auth",
  authorize,
  createProxy({ name: "auth", serviceName: "auth-service" }),
);

app.use(
  "/api/problems",
  authorize,
  createProxy({ name: "problems", serviceName: "problem-service" }),
);

app.use(
  "/api/contests",
  authorize,
  createProxy({ name: "contests", serviceName: "problem-service" }),
);

app.use(
  "/api/submissions",
  authorize,
  createProxy({ name: "submissions", serviceName: "submission-service" }),
);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

/**
 * Add the error handler middleware
 */
app.use(appErrorHandler);
app.use(genericErrorHandler);

async function initializeConnection() {
  try {
    logger.info("All connections initialized successfully");
  } catch (error) {
    logger.error("Error initializing connection:", error);
    throw error;
  }
}

async function startServer() {
  try {
    await initializeConnection();

    const server = app.listen(serverConfig.PORT, async () => {
      logger.info(
        `${serverConfig.SERVICE_NAME} is running on PORT ${serverConfig.PORT}`,
      );

      await initializeServices();
      removeStaleInstancesInterval();
      startCacheRefresher();
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received - starting graceful shutdown`);

      server.close(async () => {
        logger.info("HTTP server closed");

        try {
          logger.info("All connections closed successfully");
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    logger.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();
