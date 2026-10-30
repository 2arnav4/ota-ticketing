import type { Request, Response } from "express";
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
  req.log.info({ eventId, quantity, buyer: user.name, codes: tickets.map((t) => t.code) }, "booking created");
  res.status(201).json({ tickets });
}
