// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";

type ServerConfig = {
  NODE_ENV: string;
  SERVICE_NAME: string;
  PROBLEM_DB_URI: string;
  REDIS_URL: string;
};

function loadEnv() {
  dotenv.config();
  console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  SERVICE_NAME: process.env.SERVICE_NAME || "background-worker-service",
  NODE_ENV: process.env.NODE_ENV || "development",

  PROBLEM_DB_URI:
    process.env.PROBLEM_DB_URI || "mongodb://localhost:27017/leetcode_problem_service",

  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
};
