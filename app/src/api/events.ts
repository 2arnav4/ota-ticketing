import { apiRequest } from "./client";
import type { EventSummary } from "./types";

export async function fetchEvents(userId: string, signal?: AbortSignal): Promise<EventSummary[]> {
  const { events } = await apiRequest<{ events: EventSummary[] }>("/events", { userId, signal });
  return events;
}
