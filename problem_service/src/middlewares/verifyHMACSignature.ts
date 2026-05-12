import { NextFunction, Request, Response } from "express";
import { serverConfig } from "../config";
import { generateHMACSignature } from "../utils/generateHMACSignature";
import crypto from "crypto";
import logger from "../config/logger.config";

/**
 * Why Raw Body for HMAC?
 * HMAC signs a string, not an object.
 * When the sender signs the request:
 * signed → '{"timestamp":1234,"name":"foo"}'  // exact string
 * By the time it reaches your middleware, express.json() has already parsed it into a JS object.
 * When you JSON.stringify() that object back:
 * re-stringified → '{"name":"foo","timestamp":1234}'  // key order may differ!
 * The strings don't match → signatures don't match → legitimate requests get rejected.
 * Raw body = the exact string that was signed. No parsing, no re-stringifying, no risk of mismatch
 */

const apiGatewaySecret = serverConfig.API_GATEWAY_HMAC_SHARED_SECRET;
const internalSecret = serverConfig.INTERNAL_HMAC_SHARED_SECRET;

export const verifyHAMCSignature = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiGatewayHMACSignature: string =
    (req.headers["x-api-gateway-signature"] as string) || "";

  const timestamp: string =
    (req.headers["x-api-gateway-timestamp"] as string) || "";

  if (!apiGatewayHMACSignature || !timestamp) {
    res.status(401).json({
      success: false,
      message: "Missing required headers",
    });

    return;
  }

  const payload = {
    method: req.method,
    path: req.originalUrl,
    timestamp,
    body: req.body || {},
  };

  const expectedSignature = generateHMACSignature(
    JSON.stringify(payload),
    apiGatewaySecret,
  );

  const isValid = crypto.timingSafeEqual(
    Buffer.from(apiGatewayHMACSignature),
    Buffer.from(expectedSignature),
  );

  if (!isValid) {
    res.status(401).json({
      success: false,
      message: "Invalid signature",
    });

    return;
  }

  // checking if the request is not older than 5 minutes
  if (Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
    res.status(401).json({
      success: false,
      message: "Request expired",
    });

    return;
  }

  next();
};

export const verifyInternalHAMCSignature = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const internalHMACSignature: string =
    (req.headers["x-internal-hmac-signature"] as string) || "";

  const timestamp: string =
    (req.headers["x-internal-hmac-timestamp"] as string) || "";

  if (!internalHMACSignature || !timestamp) {
    res.status(401).json({
      success: false,
      message: "Missing required internal HMAC signature headers or timestamp",
    });

    return;
  }

  const payload = {
    method: req.method,
    path: req.originalUrl,
    timestamp,
    body: req.body || {},
  };

  const expectedSignature = generateHMACSignature(
    JSON.stringify(payload),
    internalSecret,
  );

  const isValid = crypto.timingSafeEqual(
    Buffer.from(internalHMACSignature),
    Buffer.from(expectedSignature),
  );

  if (!isValid) {
    res.status(401).json({
      success: false,
      message: "Invalid signature",
    });

    return;
  }

  // checking if the request is not older than 5 minutes
  if (Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
    res.status(401).json({
      success: false,
      message: "Request expired",
    });

    return;
  }

  logger.info("Internal HMAC signature verified");
  next();
};
