import type { Request, Response } from "express";
import { codeHint } from "../domain/ticketCode";
import { currentUser } from "../middleware/userContext";
import { BookingBody, EventIdParams, IdempotencyHeader } from "../schemas/booking";
import { parseOrThrow } from "../schemas/parse";
import { bookTickets } from "../services/bookingService";

export async function postBooking(req: Request, res: Response): Promise<void> {
  const { id: eventId } = parseOrThrow(EventIdParams, req.params);
  const { quantity } = parseOrThrow(BookingBody, req.body);
  const idempotencyKey = parseOrThrow(IdempotencyHeader, req.header("idempotency-key"));
  const user = currentUser(req);
  const { tickets, replayed } = await bookTickets({ userId: user.id, eventId, quantity, idempotencyKey });
  if (replayed) {
    // Same answer as the first time, flagged so clients and logs can tell a resend from a new booking.
    res.setHeader("Idempotent-Replayed", "true");
    req.log.info({ eventId, quantity, ticketIds: tickets.map((t) => t.id) }, "booking replayed");
    res.status(201).json({ tickets });
    return;
  }
  // One line per accepted booking, so a race is readable in the logs next to the 409s it beat.
  // Never full codes or names: logs reach Vercel's viewer and drains (G2-1). Ids + last 4 are enough to trace.
  req.log.info(
    { eventId, quantity, ticketIds: tickets.map((t) => t.id), codes: tickets.map((t) => codeHint(t.code)) },
    "booking created",
  );
  res.status(201).json({ tickets });
}
