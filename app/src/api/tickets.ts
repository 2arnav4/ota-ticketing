import { apiRequest } from "./client";
import type { Ticket } from "./types";

export async function fetchMyTickets(userId: string, signal?: AbortSignal): Promise<Ticket[]> {
  const { tickets } = await apiRequest<{ tickets: Ticket[] }>("/me/tickets", { userId, signal });
  return tickets;
}
