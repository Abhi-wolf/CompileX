// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";

type ServerConfig = {
  PORT: number;
  DB_URI: string;
  SERVICE_NAME: string;
  NODE_ENV: string;
  JWT_ACCESS_SECRET: string;
  PROBLEM_SERVICE_URL: string;
  EVALUATION_JOB_NAME: string;
  SUBMISSION_QUEUE_NAME: string;
  STATUS_UPDATE_QUEUE_NAME: string;
  STATUS_UPDATE_JOB_NAME: string;
  REDIS_URL: string;
  API_GATEWAY_HMAC_SHARED_SECRET: string;
  INTERNAL_HMAC_SHARED_SECRET: string;
  CONTEST_SUBMISSION_STATUS_UPDATE_JOB_NAME:string
};

function loadEnv() {
  dotenv.config();
  console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3020,
  SERVICE_NAME: process.env.SERVICE_NAME || "submission-service",
  NODE_ENV: process.env.NODE_ENV || "development",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || "ldfjsdfkEKFHWK#&!#*81273",

  EVALUATION_JOB_NAME: process.env.EVALUATION_JOB_NAME || "evaluate-submission",
  SUBMISSION_QUEUE_NAME:
    process.env.SUBMISSION_QUEUE_NAME || "submission_queue",

  STATUS_UPDATE_QUEUE_NAME:
    process.env.STATUS_UPDATE_QUEUE_NAME || "status_update_queue",

  STATUS_UPDATE_JOB_NAME:
    process.env.STATUS_UPDATE_JOB_NAME || "update-submission-status",

  CONTEST_SUBMISSION_STATUS_UPDATE_JOB_NAME:
    process.env.CONTEST_SUBMISSION_STATUS_UPDATE_JOB_NAME || "contest-submission-status-update-status",

  DB_URI:
    process.env.DB_URI ||
    "mongodb://localhost:27017/leetcode_submission_service",

  PROBLEM_SERVICE_URL:
    process.env.PROBLEM_SERVICE_URL || "http://localhost:3010/api/v1",

  API_GATEWAY_HMAC_SHARED_SECRET:
    process.env.API_GATEWAY_HMAC_SHARED_SECRET || "3049sKKJDIWEO2983023909234",

  INTERNAL_HMAC_SHARED_SECRET:
    process.env.INTERNAL_HMAC_SHARED_SECRET || "kfsKE(@#*oweiKOQWID23984",
};
