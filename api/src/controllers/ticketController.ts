import type { Request, Response } from "express";
import { currentUser } from "../middleware/userContext";
import { listTicketsForUser } from "../services/ticketService";

export async function getMyTickets(req: Request, res: Response): Promise<void> {
  const tickets = await listTicketsForUser(currentUser(req).id);
  res.json({ tickets });
}
