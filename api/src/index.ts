import type { Express } from "express";
import { createApp, logger } from "./createApp";
import { env } from "./config/env";
import { prisma } from "./db/prisma";

// Typed with express here on purpose: Vercel only treats an entry file that imports express as an Express app.
const app: Express = createApp();

// Vercel's entry point. It looks for app.*, index.* or server.* (in that order) and needs the Express app as
// the default export, so the factory lives in createApp.ts and this is the only file named like an entry.
// Vercel sets VERCEL=1; locally we bind a port instead.
if (!process.env.VERCEL) {
  const server = app.listen(env.PORT, () => logger.info(`API listening on http://localhost:${env.PORT}`));

  // Close the DB pool on Ctrl-C / tsx restart; without this the open pool keeps the process alive and tsx force-kills it.
  const shutdown = () => {
    server.close(() => {
      prisma.$disconnect().finally(() => process.exit(0));
    });
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

export default app;
