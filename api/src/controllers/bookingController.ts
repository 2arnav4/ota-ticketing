import type { Request, Response } from "express";
import { codeHint } from "../domain/ticketCode";
import { currentUser } from "../middleware/userContext";
import { BookingBody, EventIdParams } from "../schemas/booking";
import { parseOrThrow } from "../schemas/parse";
import { bookTickets } from "../services/bookingService";

export async function postBooking(req: Request, res: Response): Promise<void> {
  const { id: eventId } = parseOrThrow(EventIdParams, req.params);
  const { quantity } = parseOrThrow(BookingBody, req.body);
  const user = currentUser(req);
  const tickets = await bookTickets(user.id, eventId, quantity);
  // One line per accepted booking, so a race is readable in the logs next to the 409s it beat.
  // Never full codes or names: logs reach Vercel's viewer and drains (G2-1). Ids + last 4 are enough to trace.
  req.log.info(
    { eventId, quantity, ticketIds: tickets.map((t) => t.id), codes: tickets.map((t) => codeHint(t.code)) },
    "booking created",
  );
  res.status(201).json({ tickets });
}
