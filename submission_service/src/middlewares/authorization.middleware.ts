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
