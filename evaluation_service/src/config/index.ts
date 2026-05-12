// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";

type ServerConfig = {
  PORT: number;
  SERVICE_NAME: string;
  NODE_ENV: string;
  PROBLEM_SERVICE_URL: string;
  SUBMISSION_SERVICE_URL: string;
  EVALUATION_JOB_NAME: string;
  SUBMISSION_QUEUE_NAME: string;
  STATUS_UPDATE_QUEUE_NAME: string;
  STATUS_UPDATE_JOB_NAME: string;
  REDIS_URL: string;
  CONTEST_SUBMISSION_STATUS_UPDATE_JOB_NAME:string;
};

function loadEnv() {
  dotenv.config();
  console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3020,
  SERVICE_NAME: process.env.SERVICE_NAME || "evaluation-service",
  NODE_ENV: process.env.NODE_ENV || "development",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  EVALUATION_JOB_NAME: process.env.EVALUATION_JOB_NAME || "evaluate-submission",
  SUBMISSION_QUEUE_NAME:
    process.env.SUBMISSION_QUEUE_NAME || "submission_queue",

  STATUS_UPDATE_QUEUE_NAME:
    process.env.STATUS_UPDATE_QUEUE_NAME || "status_update_queue",

  STATUS_UPDATE_JOB_NAME:
    process.env.STATUS_UPDATE_JOB_NAME || "update-submission-status",

  CONTEST_SUBMISSION_STATUS_UPDATE_JOB_NAME:
    process.env.CONTEST_SUBMISSION_STATUS_UPDATE_JOB_NAME || "contest-submission-status-update-status",

  PROBLEM_SERVICE_URL:
    process.env.PROBLEM_SERVICE_URL || "http://localhost:3010/api/v1",
  SUBMISSION_SERVICE_URL:
    process.env.SUBMISSION_SERVICE_URL || "http://localhost:3020/api/v1",
};
