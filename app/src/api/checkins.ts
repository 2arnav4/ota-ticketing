import { apiRequest } from "./client";
import type { CheckedInTicket } from "./types";

export async function checkInTicket(userId: string, code: string): Promise<CheckedInTicket> {
  const { ticket } = await apiRequest<{ ticket: CheckedInTicket }>("/checkins", {
    userId,
    method: "POST",
    body: { code },
  });
  return ticket;
}
