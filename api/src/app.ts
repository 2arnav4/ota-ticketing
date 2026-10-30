import { randomUUID } from "node:crypto";
import express from "express";
import helmet from "helmet";
import type { Logger } from "pino";
import { pinoHttp } from "pino-http";
import { env } from "./config/env";
import { corsMiddleware } from "./middleware/cors";
import { logger as defaultLogger } from "./logging/logger";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { writeRateLimit } from "./middleware/rateLimit";
import { checkinsRouter } from "./routes/checkins";
import { eventsRouter } from "./routes/events";
import { healthRouter } from "./routes/health";
import { internalRouter } from "./routes/internal";
import { meRouter } from "./routes/me";

export { defaultLogger as logger };

type AppOptions = { writesPerMinute?: number; logger?: Logger };

export function createApp({
  writesPerMinute = env.RATE_LIMIT_PER_MINUTE,
  logger = defaultLogger,
}: AppOptions = {}): express.Express {
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
    }),
  );
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: "10kb" }));

  // One limiter instance shared by every write route, so book + check-in count against the same budget.
  const writeLimit = writeRateLimit(writesPerMinute);

  app.use("/health", healthRouter);
  app.use("/events", eventsRouter(writeLimit));
  app.use("/me", meRouter);
  app.use("/checkins", checkinsRouter(writeLimit));
  app.use("/internal", internalRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
