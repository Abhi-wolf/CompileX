import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
    iat: number;
    exp: number;
  };
}

export interface DecodedToken {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}