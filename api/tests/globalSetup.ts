import { execSync } from "node:child_process";
import { config } from "dotenv";

// Runs once before all suites: bring the test DB schema up to date with the committed migrations.
export default function globalSetup(): void {
  config({ quiet: true });
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl || !new URL(testUrl).pathname.endsWith("_test")) {
    throw new Error("TEST_DATABASE_URL must be set and point at a database whose name ends in _test");
  }
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: testUrl }, stdio: "pipe" });
}
