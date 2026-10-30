import type { Request, Response } from "express";
import { CheckinBody } from "../schemas/checkin";
import { parseOrThrow } from "../schemas/parse";
import { checkInTicket } from "../services/checkinService";

export async function postCheckin(req: Request, res: Response): Promise<void> {
  const { code } = parseOrThrow(CheckinBody, req.body);
  const ticket = await checkInTicket(code);
  req.log.info({ code, holder: ticket.holderName, checkedInAt: ticket.checkedInAt }, "ticket checked in");
  res.json({ ticket });
}
