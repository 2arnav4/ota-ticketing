import { randomUUID } from "node:crypto";
import express from "express";
import helmet from "helmet";
import { pino } from "pino";
import { pinoHttp } from "pino-http";
import { env } from "./config/env";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { writeRateLimit } from "./middleware/rateLimit";
import { checkinsRouter } from "./routes/checkins";
import { eventsRouter } from "./routes/events";
import { healthRouter } from "./routes/health";
import { internalRouter } from "./routes/internal";
import { meRouter } from "./routes/me";

export const logger = pino({ level: env.LOG_LEVEL });

type AppOptions = { writesPerMinute?: number };

export function createApp({ writesPerMinute = env.RATE_LIMIT_PER_MINUTE }: AppOptions = {}): express.Express {
  const app = express();

  // Vercel puts exactly one proxy in front; trust its X-Forwarded-For so req.ip (and the rate limiter) sees the client.
  app.set("trust proxy", 1);
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
