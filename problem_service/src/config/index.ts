// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";

type ServerConfig = {
  PORT: number;
  DB_URI: string;
  SERVICE_NAME: string;
  NODE_ENV: string;
  API_GATEWAY_HMAC_SHARED_SECRET: string;
  JWT_ACCESS_SECRET: string;
  INTERNAL_HMAC_SHARED_SECRET: string;
};

function loadEnv() {
  dotenv.config();
  console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3010,
  SERVICE_NAME: process.env.SERVICE_NAME || "problem-service",
  NODE_ENV: process.env.NODE_ENV || "development",
  DB_URI:
    process.env.DB_URI || "mongodb://localhost:27017/leetcode_problem_service",

  API_GATEWAY_HMAC_SHARED_SECRET:
    process.env.API_GATEWAY_HMAC_SHARED_SECRET || "3049sKKJDIWEO2983023909234",

  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || "ldfjsdfkEKFHWK#&!#*81273",

  INTERNAL_HMAC_SHARED_SECRET:
    process.env.INTERNAL_HMAC_SHARED_SECRET || "kfsKE(@#*oweiKOQWID23984",
};
