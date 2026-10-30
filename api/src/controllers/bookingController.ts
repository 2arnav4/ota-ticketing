import type { Request, Response } from "express";
import { currentUser } from "../middleware/userContext";
import { BookingBody, EventIdParams } from "../schemas/booking";
import { parseOrThrow } from "../schemas/parse";
import { bookTickets } from "../services/bookingService";

export async function postBooking(req: Request, res: Response): Promise<void> {
  const { id: eventId } = parseOrThrow(EventIdParams, req.params);
  const { quantity } = parseOrThrow(BookingBody, req.body);
  const tickets = await bookTickets(currentUser(req).id, eventId, quantity);
  res.status(201).json({ tickets });
}
