import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/api/events";
import { useSession } from "@/state/session";

// userId is in the key so switching users never shows the previous user's cached response.
export function useEvents() {
  const { userId } = useSession();
  return useQuery({
    queryKey: ["events", userId],
    queryFn: ({ signal }) => fetchEvents(userId, signal),
  });
}
