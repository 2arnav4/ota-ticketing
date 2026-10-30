import { z } from "zod";

export const MAX_TICKETS_PER_BOOKING = 4;

export const EventIdParams = z.object({ id: z.uuid() });

// strictObject: unknown keys (userId, price, ticketsLeft...) are rejected, not silently ignored. Blocks mass assignment.
// z.number().int() rejects "2", 2.5, NaN and Infinity; only a real JSON integer 1–4 passes.
export const BookingBody = z.strictObject({
  quantity: z.number().int().min(1).max(MAX_TICKETS_PER_BOOKING),
});
