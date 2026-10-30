import { randomUUID } from "node:crypto";
import express from "express";
import helmet from "helmet";
import { pino } from "pino";
import { pinoHttp } from "pino-http";
import { env } from "./config/env";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { eventsRouter } from "./routes/events";
import { healthRouter } from "./routes/health";
import { meRouter } from "./routes/me";

export const logger = pino({ level: env.LOG_LEVEL });

export function createApp(): express.Express {
  const app = express();

  // Vercel puts exactly one proxy in front; trust its X-Forwarded-For so req.ip (and the rate limiter) sees the client.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
      },
    }),
  );
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: "10kb" }));

  app.use("/health", healthRouter);
  app.use("/events", eventsRouter);
  app.use("/me", meRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
