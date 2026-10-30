import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/api/me";
import { useSession } from "@/state/session";

export function useMe() {
  const { userId } = useSession();
  return useQuery({
    queryKey: ["me", userId],
    queryFn: ({ signal }) => fetchMe(userId, signal),
    staleTime: Infinity,
  });
}
