import { Router, type RequestHandler } from "express";
import { postCheckin } from "../controllers/checkinController";
import { requireRole } from "../middleware/requireRole";
import { userContext } from "../middleware/userContext";

export function checkinsRouter(writeLimit: RequestHandler): Router {
  const router = Router();
  // Order is the security model: throttle → who are you → are you staff → only then read the body.
  router.post("/", writeLimit, userContext, requireRole("STAFF"), postCheckin);
  return router;
}
