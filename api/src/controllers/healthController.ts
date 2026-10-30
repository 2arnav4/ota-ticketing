import type { Request, Response } from "express";
import { isDatabaseUp } from "../services/healthService";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const dbUp = await isDatabaseUp();
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? "ok" : "degraded", db: dbUp ? "up" : "down" });
}
