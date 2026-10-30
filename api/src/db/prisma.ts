import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import type { PoolConfig } from "mariadb";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "../config/env";

function poolConfigFromUrl(databaseUrl: string, useSsl: boolean): PoolConfig {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    // Small on purpose: every serverless instance holds its own pool, and the free MySQL tier caps total connections.
    connectionLimit: 5,
    // Fail /health and requests fast when the DB is unreachable instead of hanging for the 10s default.
    acquireTimeout: 5000,
    connectTimeout: 5000,
    ssl: useSsl ? { rejectUnauthorized: true } : false,
    // MySQL 8.4 defaults to caching_sha2_password; without TLS the driver must fetch the server's RSA key. Local Docker only.
    allowPublicKeyRetrieval: !useSsl,
  };
}

// One client per process (module scope), reused across requests and across warm Vercel invocations.
export const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(poolConfigFromUrl(env.DATABASE_URL, env.DATABASE_SSL)),
});
