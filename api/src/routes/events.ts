import { Router, type RequestHandler } from "express";
import { postBooking } from "../controllers/bookingController";
import { getEvents } from "../controllers/eventController";
import { userContext } from "../middleware/userContext";

export function eventsRouter(ipLimit: RequestHandler, bookingLimit: RequestHandler): Router {
  const router = Router();
  router.get("/", userContext, getEvents);
  // IP limit before identity: a flood of bad requests shouldn't cost a DB lookup each.
  // Booking limit after identity (it is keyed by user), so fans sharing one IP don't use up each other's budget.
  router.post("/:id/book", ipLimit, userContext, bookingLimit, postBooking);
  return router;
}
