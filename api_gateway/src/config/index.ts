// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";

type ServerConfig = {
  PORT: number;
  NODE_ENV: string;
  SERVICE_NAME: string;
  API_GATEWAY_HMAC_SHARED_SECRET: string;
  JWT_ACCESS_SECRET: string;
  FRONTEND_URL: string;
};

function loadEnv() {
  dotenv.config();
  console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3000,
  SERVICE_NAME: process.env.SERVICE_NAME || "api_gateway_service",
  NODE_ENV: process.env.NODE_ENV || "development",

  API_GATEWAY_HMAC_SHARED_SECRET:
    process.env.API_GATEWAY_HMAC_SHARED_SECRET || "3049sKKJDIWEO2983023909234",

  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || "ldfjsdfkEKFHWK#&!#*81273",

  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
};
