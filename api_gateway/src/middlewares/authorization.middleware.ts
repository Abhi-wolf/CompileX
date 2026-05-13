import { NextFunction, Response } from "express";
import logger from "../config/logger.config";
import * as jwt from "jsonwebtoken";
import { serverConfig } from "../config";
import { AuthRequest } from "../types/request.types";
import { publicAPIs } from "../config/servicesInfos";

export const authorize = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (publicAPIs.includes(req.originalUrl)) {
      return next();
    }

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res
        .status(401)
        .json({ message: "Token not found, validation at API GATEWAY" });
        
      return;
    }

    jwt.verify(token, serverConfig.JWT_ACCESS_SECRET);

    next();
  } catch (error) {
    logger.error("Authorization error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      res
        .status(401)
        .json({ success: false, message: "Invalid token, validation at API GATEWAY" });
      return;
    }
    next(error);
  }
};
