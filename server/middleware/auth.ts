import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import type { AccessTokenPayload } from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

const unauthorized = (res: Response) => res.status(401).json({ error: "Unauthorized" });

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return unauthorized(res);
  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = await verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    console.error("Access token verification failed", error);
    return unauthorized(res);
  }
};

export const protectWrites = async (req: Request, res: Response, next: NextFunction) => {
  const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method.toUpperCase());
  if (!isWrite) return next();

  if (req.path.startsWith("/auth/")) return next();
  return authenticate(req, res, next);
};
