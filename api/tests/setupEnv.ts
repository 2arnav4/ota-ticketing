import { config } from "dotenv";

// Runs before any test module is loaded, so src/config/env.ts sees the test values.
config({ quiet: true });

const testUrl = process.env.TEST_DATABASE_URL;
// Later steps wipe this database before each run. Refuse anything that is not clearly a test DB.
if (!testUrl || !new URL(testUrl).pathname.endsWith("_test")) {
  throw new Error("TEST_DATABASE_URL must be set and point at a database whose name ends in _test");
}

process.env.DATABASE_URL = testUrl;
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";
process.env.CORS_ORIGINS = "http://localhost:8081";
