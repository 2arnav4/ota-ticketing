import { useQuery } from "@tanstack/react-query";
import { fetchMyTickets } from "@/api/tickets";
import { useSession } from "@/state/session";

export function useTickets() {
  const { userId } = useSession();
  return useQuery({
    queryKey: ["tickets", userId],
    queryFn: ({ signal }) => fetchMyTickets(userId, signal),
  });
}
