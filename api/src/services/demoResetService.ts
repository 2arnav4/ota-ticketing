import { seedDemoData } from "../../prisma/seed";
import { prisma } from "../db/prisma";

// Reviewers share one live database. A daily reset puts the "2 left" event and seed tickets back, so every
// reviewer can try the sold-out path. Idempotent, so Vercel delivering the cron twice is harmless.
export function resetDemoData(): Promise<void> {
  return seedDemoData(prisma);
}
