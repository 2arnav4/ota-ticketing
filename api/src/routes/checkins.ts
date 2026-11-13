import { Router, type RequestHandler } from "express";
import { postCheckin } from "../controllers/checkinController";
import { requireRole } from "../middleware/requireRole";
import { userContext } from "../middleware/userContext";

export function checkinsRouter(ipLimit: RequestHandler, checkinLimit: RequestHandler): Router {
  const router = Router();
  // Order is the security model: throttle by IP → who are you → are you staff → throttle by staff user
  // → only then validate the body (express.json has already parsed it, capped at 10 KB, before any route).
  // Check-ins have their own budgets, so bookings can never block a busy gate.
  router.post("/", ipLimit, userContext, requireRole("STAFF"), checkinLimit, postCheckin);
  return router;
}
