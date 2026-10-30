import type { Request, Response } from "express";
import { resetDemoData } from "../services/demoResetService";

export async function getResetDemo(req: Request, res: Response): Promise<void> {
  await resetDemoData();
  req.log.info("demo data reset");
  res.json({ reset: true });
}
