import type { Prisma } from "../generated/prisma/client";

// One shape for a ticket everywhere it leaves the API (booking, My Tickets, check-in).
export const ticketWithEvent = {
  id: true,
  code: true,
  checkedInAt: true,
  createdAt: true,
  event: { select: { id: true, name: true, venue: true, city: true, startsAt: true } },
} satisfies Prisma.TicketSelect;

export type TicketView = Prisma.TicketGetPayload<{ select: typeof ticketWithEvent }>;
