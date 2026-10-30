import { Router, type RequestHandler } from "express";
import { postBooking } from "../controllers/bookingController";
import { getEvents } from "../controllers/eventController";
import { userContext } from "../middleware/userContext";

export function eventsRouter(writeLimit: RequestHandler): Router {
  const router = Router();
  router.get("/", userContext, getEvents);
  // Limit before identity: a flood of bad requests shouldn't cost a DB lookup each.
  router.post("/:id/book", writeLimit, userContext, postBooking);
  return router;
}
