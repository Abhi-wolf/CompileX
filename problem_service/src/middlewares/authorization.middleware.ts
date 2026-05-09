import { NextFunction, Response } from "express";
import logger from "../config/logger.config";
import * as jwt from "jsonwebtoken";
import { serverConfig } from "../config";
import { AuthRequest, DecodedToken } from "../types/request.type";

export const authorize = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Token not found" });
      return;
    }

    const decoded = jwt.verify(
      token,
      serverConfig.JWT_ACCESS_SECRET,
    ) as DecodedToken;
    req.user = decoded;

    // console.log("decoded = ",decoded)

    next();
  } catch (error) {
    logger.error("Authorization error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }
    next(error);
  }
};

export const authorizeRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.roles) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    const hasRole = roles.some((role) => req.user?.roles.includes(role));
    
    if (!hasRole) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    next();
  };
};
