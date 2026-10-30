import { createApp, logger } from "./app";
import { env } from "./config/env";

const app = createApp();

// Vercel imports the default export and runs it as a function; it sets VERCEL=1. Locally we bind a port.
if (!process.env.VERCEL) {
  app.listen(env.PORT, () => logger.info(`API listening on http://localhost:${env.PORT}`));
}

export default app;
