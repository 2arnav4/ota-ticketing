import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Used by the Prisma CLI only (migrate, generate, studio). The running app connects through the adapter in src/db/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
