import { prisma } from "../db/prisma";
import { AppError } from "../domain/errors";
import { generateTicketCode } from "../domain/ticketCode";
import { Prisma } from "../generated/prisma/client";
import { ticketWithEvent, type TicketView } from "./ticketView";

type Tx = Prisma.TransactionClient;

/**
 * Books `quantity` tickets or throws. Never oversells, under any concurrency, on any number of instances.
 *
 * Why it holds: check and decrement are ONE conditional UPDATE. InnoDB row-locks the event while it runs, so a
 * concurrent booking waits, then re-evaluates `ticketsLeft >= quantity` against the committed value. There is
 * no read-then-write gap to race through. Do not split this into findUnique + update.
 * The CHECK (ticketsLeft >= 0) constraint is a second line of defence if this rule is ever bypassed.
 */
export async function bookTickets(userId: string, eventId: string, quantity: number, now = new Date()): Promise<TicketView[]> {
  try {
    return await bookOnce(userId, eventId, quantity, now);
  } catch (error) {
    // 60-bit codes make a collision astronomically rare; the rolled-back transaction makes one retry safe.
    if (isUniqueViolation(error)) {
      return bookOnce(userId, eventId, quantity, now);
    }
    throw error;
  }
}

function bookOnce(userId: string, eventId: string, quantity: number, now: Date): Promise<TicketView[]> {
  return prisma.$transaction(
    async (tx) => {
      const { count } = await tx.event.updateMany({
        where: { id: eventId, ticketsLeft: { gte: quantity }, startsAt: { gt: now } },
        data: { ticketsLeft: { decrement: quantity } },
      });
      if (count === 0) {
        throw await explainRejectedBooking(tx, eventId, quantity, now);
      }

      const codes = Array.from({ length: quantity }, generateTicketCode);
      await tx.ticket.createMany({ data: codes.map((code) => ({ code, eventId, userId })) });
      // MySQL has no createManyAndReturn; read the rows back by their unique codes.
      return tx.ticket.findMany({ where: { code: { in: codes } }, select: ticketWithEvent, orderBy: { code: "asc" } });
    },
    // Under a burst, requests queue for one of the pool's 5 connections; give them longer than the 2s default.
    { maxWait: 10_000, timeout: 10_000 },
  );
}

// Runs only after the guarded UPDATE matched nothing, to tell the client which rule it hit.
async function explainRejectedBooking(tx: Tx, eventId: string, quantity: number, now: Date): Promise<AppError> {
  const event = await tx.event.findUnique({ where: { id: eventId }, select: { ticketsLeft: true, startsAt: true } });
  if (!event) {
    return new AppError(404, "EVENT_NOT_FOUND", "Event not found");
  }
  if (event.startsAt <= now) {
    return new AppError(409, "EVENT_STARTED", "This event has already started");
  }
  if (event.ticketsLeft === 0) {
    return new AppError(409, "SOLD_OUT", "This event is sold out", { ticketsLeft: 0 });
  }
  return new AppError(409, "NOT_ENOUGH_LEFT", `Only ${event.ticketsLeft} left`, {
    ticketsLeft: event.ticketsLeft,
    requested: quantity,
  });
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
