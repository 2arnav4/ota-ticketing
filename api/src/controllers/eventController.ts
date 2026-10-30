import type { Request, Response } from "express";
import { listUpcomingEvents } from "../services/eventService";

export async function getEvents(_req: Request, res: Response): Promise<void> {
  const events = await listUpcomingEvents();
  res.json({ events });
}
