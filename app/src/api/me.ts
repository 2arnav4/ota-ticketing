import { apiRequest } from "./client";
import type { Me } from "./types";

export async function fetchMe(userId: string, signal?: AbortSignal): Promise<Me> {
  const { user } = await apiRequest<{ user: Me }>("/me", { userId, signal });
  return user;
}
