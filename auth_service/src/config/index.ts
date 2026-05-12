// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";

type ServerConfig = {
  PORT: number;
  SERVICE_NAME: string;
  NODE_ENV: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  API_GATEWAY_HMAC_SHARED_SECRET: string;
};

function loadEnv() {
  dotenv.config();
  console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3002,
  SERVICE_NAME: process.env.SERVICE_NAME || "auth-service",
  NODE_ENV: process.env.NODE_ENV || "development",
  DB_HOST: process.env.DB_HOST || "postgres",
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_NAME: process.env.DB_NAME || "auth_db",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "ldfjsdfkEKFHWK#&!#*81273",
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || "ldfjsdfkEKFHWK#&!#*81273",

  API_GATEWAY_HMAC_SHARED_SECRET:
    process.env.API_GATEWAY_HMAC_SHARED_SECRET || "3049sKKJDIWEO2983023909234",
};
