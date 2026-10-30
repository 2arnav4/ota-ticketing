import { pino, type DestinationStream, type Logger } from "pino";
import { env } from "../config/env";

// Request headers are logged for debugging, but these carry credentials. Logs go to Vercel's log viewer and any
// drain, so a secret written there is a leaked secret. (Gauntlet F-2: the cron secret appeared in plain text.)
export const REDACTED_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'req.headers["x-user-id"]',
  'res.headers["set-cookie"]',
];

// `destination` exists for tests that need to read what was logged; the app uses stdout.
export function createLogger(destination?: DestinationStream): Logger {
  return pino({ level: env.LOG_LEVEL, redact: { paths: REDACTED_PATHS, censor: "[redacted]" } }, destination);
}

export const logger = createLogger();
