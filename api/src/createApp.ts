import { randomUUID } from "node:crypto";
import express from "express";
import helmet from "helmet";
import type { Logger } from "pino";
import { pinoHttp } from "pino-http";
import { env } from "./config/env";
import { corsMiddleware } from "./middleware/cors";
import { logger as defaultLogger } from "./logging/logger";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { bookingLimit, checkinLimit, ipWriteLimit } from "./middleware/rateLimit";
import { checkinsRouter } from "./routes/checkins";
import { eventsRouter } from "./routes/events";
import { healthRouter } from "./routes/health";
import { internalRouter } from "./routes/internal";
import { meRouter } from "./routes/me";

export { defaultLogger as logger };

type RateLimits = { ipPerMinute: number; bookingsPerUserPerMinute: number; checkinsPerUserPerMinute: number };
type AppOptions = { rateLimits?: Partial<RateLimits>; logger?: Logger };

export function createApp({ rateLimits = {}, logger = defaultLogger }: AppOptions = {}): express.Express {
  const limits: RateLimits = {
    ipPerMinute: env.RATE_LIMIT_IP_PER_MINUTE,
    bookingsPerUserPerMinute: env.RATE_LIMIT_BOOKINGS_PER_USER_PER_MINUTE,
    checkinsPerUserPerMinute: env.RATE_LIMIT_CHECKINS_PER_USER_PER_MINUTE,
    ...rateLimits,
  };
  const app = express();

  // On Vercel exactly one proxy sits in front and it overwrites X-Forwarded-For, so trusting one hop gives the
  // real client IP. Anywhere else nothing rewrites that header: trusting it would let a client pick its own IP
  // and get a fresh rate-limit bucket per request (Gauntlet F-3). So trust it only on Vercel.
  app.set("trust proxy", process.env.VERCEL ? 1 : false);
  app.disable("x-powered-by");

  app.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => {
        const id = randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
      },
      // Method, path and status in the message itself, so a log line reads on its own: "POST /events/…/book → 409".
      // originalUrl, not url: routers rewrite req.url to the part after their mount path ("/events" → "/").
      customSuccessMessage: (req, res) => `${req.method} ${(req as express.Request).originalUrl ?? req.url} → ${res.statusCode}`,
      customErrorMessage: (req, res) => `${req.method} ${(req as express.Request).originalUrl ?? req.url} → ${res.statusCode}`,
    }),
  );
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: "10kb" }));

  // Each write route gets its own IP flood guard and its own budget keyed by user + IP, so a busy gate scanner and
  // booking fans on the same Wi-Fi never use up each other's allowance (details in rateLimit.ts).
  const bookingGuards = [ipWriteLimit(limits.ipPerMinute, "ip-bookings"), bookingLimit(limits.bookingsPerUserPerMinute)] as const;
  const checkinGuards = [ipWriteLimit(limits.ipPerMinute, "ip-checkins"), checkinLimit(limits.checkinsPerUserPerMinute)] as const;

  app.use("/health", healthRouter);
  app.use("/events", eventsRouter(...bookingGuards));
  app.use("/me", meRouter);
  app.use("/checkins", checkinsRouter(...checkinGuards));
  app.use("/internal", internalRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
