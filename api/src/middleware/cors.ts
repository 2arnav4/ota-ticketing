import cors from "cors";
import { env } from "../config/env";

// Browser-only guard. Native apps and curl send no Origin header and pass straight through; this is not access control.
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    callback(null, !origin || env.CORS_ORIGINS.includes(origin));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "X-User-Id", "Idempotency-Key"],
  exposedHeaders: ["Idempotent-Replayed"],
  maxAge: 600,
});
