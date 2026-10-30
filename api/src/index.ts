import { createApp, logger } from "./app";
import { env } from "./config/env";
import { prisma } from "./db/prisma";

const app = createApp();

// Vercel imports the default export and runs it as a function; it sets VERCEL=1. Locally we bind a port.
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
