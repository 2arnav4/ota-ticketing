import { Router } from "express";
import { getResetDemo } from "../controllers/internalController";
import { requireCronSecret } from "../middleware/requireCronSecret";

export const internalRouter = Router();

// GET because that is the method Vercel Cron uses.
internalRouter.get("/reset-demo", requireCronSecret, getResetDemo);
