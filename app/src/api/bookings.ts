import { apiRequest } from "./client";
import type { Ticket } from "./types";

export async function bookTickets(userId: string, eventId: string, quantity: number): Promise<Ticket[]> {
  const { tickets } = await apiRequest<{ tickets: Ticket[] }>(`/events/${eventId}/book`, {
    userId,
    method: "POST",
    body: { quantity },
  });
  return tickets;
}
