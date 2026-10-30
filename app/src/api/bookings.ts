import { apiRequest } from "./client";
import type { Ticket } from "./types";

// The idempotency key makes resending this exact request safe: the server answers a repeat with the original
// tickets instead of booking again. One key per tap on "Book now", reused only for retries of that tap.
export async function bookTickets(
  userId: string,
  eventId: string,
  quantity: number,
  idempotencyKey: string,
): Promise<Ticket[]> {
  const { tickets } = await apiRequest<{ tickets: Ticket[] }>(`/events/${eventId}/book`, {
    userId,
    method: "POST",
    body: { quantity },
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return tickets;
}
