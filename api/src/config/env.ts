import { config } from "dotenv";
import { z } from "zod";

// Loads .env locally; on Vercel there is no file and real env vars are used. Never overrides vars already set.
config({ quiet: true });

// `KEY=` in a .env file arrives as "", not undefined. Treat it as unset so .env.example works when copied as is.
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  DATABASE_SSL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  // PEM of the DB host's CA (Aiven uses a per-project CA, so the system trust store can't verify it).
  // Literal "\n" sequences are accepted so the PEM fits in a single-line env var.
  DATABASE_CA_CERT: optional(z.string())
    .transform((value) => value?.replace(/\\n/g, "\n")),
  // Shared secret Vercel Cron sends as "Authorization: Bearer <secret>". Unset = the reset route doesn't exist.
  CRON_SECRET: optional(z.string().min(16)),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  // Per-IP writes (book, check-in) per minute, per instance. Tests raise it so parallel bursts aren't throttled.
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof EnvSchema>;

// TLS without the CA would either fail every connection or tempt someone to disable verification. Refuse at boot.
const CheckedEnvSchema = EnvSchema.refine((value) => !value.DATABASE_SSL || Boolean(value.DATABASE_CA_CERT), {
  message: "DATABASE_SSL=true requires DATABASE_CA_CERT",
  path: ["DATABASE_CA_CERT"],
});

function loadEnv(): Env {
  const parsed = CheckedEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Fail at boot, not on the first request that touches a missing value.
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export const env = loadEnv();
