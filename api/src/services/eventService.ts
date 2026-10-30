import { prisma } from "../db/prisma";

export type EventSummary = {
  id: string;
  name: string;
  venue: string;
  city: string;
  startsAt: Date;
  pricePaise: number;
  capacity: number;
  ticketsLeft: number;
};

// "Upcoming" = not started yet. Sold-out events stay in the list so the app can show the badge.
// `now` is a parameter so tests can pin the clock.
export function listUpcomingEvents(now: Date = new Date()): Promise<EventSummary[]> {
  return prisma.event.findMany({
    where: { startsAt: { gt: now } },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      name: true,
      venue: true,
      city: true,
      startsAt: true,
      pricePaise: true,
      capacity: true,
      ticketsLeft: true,
    },
  });
}
