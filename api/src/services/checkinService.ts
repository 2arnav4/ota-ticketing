import { prisma } from "../db/prisma";
import { AppError } from "../domain/errors";
import { ticketWithEvent, type TicketView } from "./ticketView";

export type CheckinResult = TicketView & { holderName: string };

/**
 * Marks a ticket used exactly once. Same pattern as booking: the "not yet used" check and the write are ONE
 * conditional UPDATE, so two gates scanning the same QR at the same instant can't both succeed.
 * The loser gets 409 with the original check-in time.
 */
export async function checkInTicket(code: string, now = new Date()): Promise<CheckinResult> {
  const { count } = await prisma.ticket.updateMany({
    where: { code, checkedInAt: null },
    data: { checkedInAt: now },
  });

  const ticket = await prisma.ticket.findUnique({
    where: { code },
    select: { ...ticketWithEvent, user: { select: { name: true } } },
  });
  if (!ticket) {
    throw new AppError(404, "TICKET_NOT_FOUND", "No ticket with this code");
  }
  if (count === 0) {
    throw new AppError(409, "ALREADY_CHECKED_IN", "This ticket was already checked in", {
      checkedInAt: ticket.checkedInAt?.toISOString(),
    });
  }
  const { user, ...view } = ticket;
  return { ...view, holderName: user.name };
}
