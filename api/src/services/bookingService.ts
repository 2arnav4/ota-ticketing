import { prisma } from "../db/prisma";
import { AppError } from "../domain/errors";
import { generateTicketCode } from "../domain/ticketCode";
import { Prisma } from "../generated/prisma/client";
import { ticketWithEvent, type TicketView } from "./ticketView";

type Tx = Prisma.TransactionClient;

export type BookingRequestInput = {
  userId: string;
  eventId: string;
  quantity: number;
  /** Client-generated UUID per booking attempt. Optional: without it every request is a new booking. */
  idempotencyKey?: string;
};

export type BookingResult = { tickets: TicketView[]; replayed: boolean };

/**
 * Books `quantity` tickets or throws. Never oversells, under any concurrency, on any number of instances.
 *
 * Why it holds: check and decrement are ONE conditional UPDATE. InnoDB row-locks the event while it runs, so a
 * concurrent booking waits, then re-evaluates `ticketsLeft >= quantity` against the committed value. There is
 * no read-then-write gap to race through. Do not split this into findUnique + update.
 * The CHECK (ticketsLeft >= 0) constraint is a second line of defence if this rule is ever bypassed.
 *
 * Idempotency: a request carrying a key that already produced a booking returns that booking (`replayed: true`)
 * and changes nothing. The app relies on this to resend a queued booking after a dropped connection without
 * ever booking twice, including when the first attempt reached the server but its reply was lost.
 */
export async function bookTickets(input: BookingRequestInput, now = new Date()): Promise<BookingResult> {
  const earlier = await findReplay(input);
  if (earlier) {
    return earlier;
  }
  try {
    return { tickets: await bookOnce(input, now), replayed: false };
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
    // Either a concurrent request with the same key committed first (its BookingRequest row won the unique
    // index), or, astronomically rarely, a 60-bit ticket code collided. The transaction rolled back either way.
    const raced = await findReplay(input);
    if (raced) {
      return raced;
    }
    return { tickets: await bookOnce(input, now), replayed: false };
  }
}

async function findReplay({ userId, eventId, quantity, idempotencyKey }: BookingRequestInput): Promise<BookingResult | null> {
  if (!idempotencyKey) {
    return null;
  }
  const earlier = await prisma.bookingRequest.findUnique({
    where: { userId_idempotencyKey: { userId, idempotencyKey } },
    select: { eventId: true, quantity: true, tickets: { select: ticketWithEvent, orderBy: { code: "asc" } } },
  });
  if (!earlier) {
    return null;
  }
  // Same key, different booking: a client bug. Refuse rather than silently return the wrong tickets.
  if (earlier.eventId !== eventId || earlier.quantity !== quantity) {
    throw new AppError(422, "IDEMPOTENCY_KEY_REUSED", "This Idempotency-Key was already used for a different booking");
  }
  return { tickets: earlier.tickets, replayed: true };
}

function bookOnce({ userId, eventId, quantity, idempotencyKey }: BookingRequestInput, now: Date): Promise<TicketView[]> {
  return prisma.$transaction(
    async (tx) => {
      // Claim the key first: a concurrent request with the same key blocks on this unique row until we commit
      // or roll back, so two copies of one booking can't both get past here.
      const request = idempotencyKey
        ? await tx.bookingRequest.create({ data: { userId, idempotencyKey, eventId, quantity }, select: { id: true } })
        : null;

      const { count } = await tx.event.updateMany({
        where: { id: eventId, ticketsLeft: { gte: quantity }, startsAt: { gt: now } },
        data: { ticketsLeft: { decrement: quantity } },
      });
      if (count === 0) {
        // Throwing rolls back the key claim too, so the same key can be retried later.
        throw await explainRejectedBooking(tx, eventId, quantity, now);
      }

      const codes = Array.from({ length: quantity }, generateTicketCode);
      await tx.ticket.createMany({
        data: codes.map((code) => ({ code, eventId, userId, bookingRequestId: request?.id ?? null })),
      });
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
