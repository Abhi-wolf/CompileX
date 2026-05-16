import { NextFunction, Request, Response } from "express";
import {
  looseRoutes,
  moderateRoutes,
  strictRoutes,
} from "../config/servicesInfos";
import { pathToRegexp } from "path-to-regexp";
import { TokenBucket } from "../utils/tokenBucket.algo";

const looseTokenBucketLimiter = new TokenBucket({
  capacity: 120,
  refillRate: 60,
  refillInterval: 60,
});

const moderateTokenBucketLimiter = new TokenBucket({
  capacity: 30,
  refillRate: 20,
  refillInterval: 60,
});

const strictTokenBucketLimiter = new TokenBucket({
  capacity: 10,
  refillRate: 5,
  refillInterval: 60,
});

function getTier(path: string, method: string): string | null {
  const isMatch = (routes: { path: string; method: string }[]) =>
    routes.some(
      (r) =>
        pathToRegexp(r.path).regexp.test(path) &&
        r.method === method.toUpperCase(),
    );

  if (isMatch(strictRoutes)) return "strict";
  if (isMatch(moderateRoutes)) return "moderate";
  if (isMatch(looseRoutes)) return "loose";

  return null;
}

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const tier = getTier(req.path, req.method);

  if (!tier) {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });

    return;
  }

  switch (tier) {
    case "loose":
      return handleLimit(req, res, next, looseTokenBucketLimiter, 120);

    case "moderate":
      return handleLimit(req, res, next, moderateTokenBucketLimiter, 30);

    case "strict":
      return handleLimit(req, res, next, strictTokenBucketLimiter, 10);
  }
};

const handleLimit = async (
  req: Request,
  res: Response,
  next: NextFunction,
  limiter: TokenBucket,
  limit: number,
) => {
  const key = req.ip || "unknown";

  const result = await limiter.allow(key);

  const { allowed, remaining } = result;

  res.setHeader("X-RateLimit-Limit", limit.toString());
  res.setHeader("X-RateLimit-Remaining", remaining.toString());

  if (!allowed) {
    res.status(429).json({
      success: false,
      message: "Too many requests",
    });

    return;
  }

  next();
};
