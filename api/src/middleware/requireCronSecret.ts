import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../config/env";
import { AppError } from "../domain/errors";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

// Vercel Cron sends "Authorization: Bearer <CRON_SECRET>". Hashing both sides gives equal-length buffers, so
// timingSafeEqual can compare without leaking the secret's length or prefix through response timing.
// Without CRON_SECRET configured the route answers 404, as if it didn't exist.
export const requireCronSecret: RequestHandler = (req, _res, next) => {
  if (!env.CRON_SECRET) {
    throw new AppError(404, "NOT_FOUND", "Route not found");
  }
  const header = req.header("authorization") ?? "";
  if (!timingSafeEqual(digest(header), digest(`Bearer ${env.CRON_SECRET}`))) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid cron credentials");
  }
  next();
};
