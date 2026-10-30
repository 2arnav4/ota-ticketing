import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { AppError } from "../domain/errors";

// Per-IP cap on writes. In memory, so on Vercel it is per function instance, not global: it slows a single
// abusive client, it is not a hard quota. A global limit belongs in Vercel Firewall or a shared store (README).
export function writeRateLimit(perMinute: number): RequestHandler {
  return rateLimit({
    windowMs: 60_000,
    limit: perMinute,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: () => {
      throw new AppError(429, "RATE_LIMITED", "Too many requests, slow down");
    },
  });
}
