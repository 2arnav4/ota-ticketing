import type { Request, Response } from "express";
import { codeHint } from "../domain/ticketCode";
import { CheckinBody } from "../schemas/checkin";
import { parseOrThrow } from "../schemas/parse";
import { checkInTicket } from "../services/checkinService";

export async function postCheckin(req: Request, res: Response): Promise<void> {
  const { code } = parseOrThrow(CheckinBody, req.body);
  const ticket = await checkInTicket(code);
  // Same rule as booking: no full code, no holder name in logs (G2-1).
  req.log.info({ ticketId: ticket.id, code: codeHint(code), checkedInAt: ticket.checkedInAt }, "ticket checked in");
  res.json({ ticket });
}
