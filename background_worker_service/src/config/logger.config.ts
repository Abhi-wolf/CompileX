import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { serverConfig } from ".";
import { getCorrelationId } from "../utils/helpers/request.helpers";

const isProd = serverConfig.NODE_ENV === "production";

// Structured Format (Production / File)
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // captures stack traces on Error objects
  winston.format((info) => {
    info.serviceName = serverConfig.SERVICE_NAME;
    info.environment = serverConfig.NODE_ENV;
    info.correlationId = info.correlationId || getCorrelationId();
    return info;
  })(),
  winston.format.json(),
);

// Dev Format (Console / Local)
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "MM-DD-YYYY HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp, ...data }) => {
    const extra = Object.keys(data).length ? JSON.stringify(data, null, 2) : "";
    const cid = data.correlationId || getCorrelationId();
    return `${timestamp} [${level}] ${cid} ${message} ${extra}`;
  }),
);

// ─── Logger ───────────────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: isProd ? "info" : "debug", // suppress debug logs in prod
  transports: [
    // Console → structured in prod, pretty in dev (because in dev we often read logs directly from the console, while in prod they are consumed by log aggregators)
    new winston.transports.Console({
      format: isProd ? structuredFormat : devFormat,
    }),

    // TODO: remove this when we integrate with log aggregators like Grafana Loki, since they can directly consume logs from console in structured format, and we won't need to maintain log files on our server
    // Rotating file → always structured JSON for log aggregators
    new DailyRotateFile({
      filename: "logs/%DATE%-app.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: structuredFormat,
    }),

    // Error-only file → easier to isolate failures
    new DailyRotateFile({
      filename: "logs/%DATE%-error.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "14d",
      format: structuredFormat,
    }),
  ],
});

export default logger;
