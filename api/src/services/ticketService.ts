import { prisma } from "../db/prisma";
import { ticketWithEvent, type TicketView } from "./ticketView";

// Soonest event first; within an event, in booking order. Past events stay so used tickets remain visible.
export function listTicketsForUser(userId: string): Promise<TicketView[]> {
  return prisma.ticket.findMany({
    where: { userId },
    select: ticketWithEvent,
    orderBy: [{ event: { startsAt: "asc" } }, { createdAt: "asc" }, { code: "asc" }],
  });
}
