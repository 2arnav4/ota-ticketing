import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkInTicket } from "@/api/checkins";
import { useSession } from "@/state/session";

export function useCheckin() {
  const { userId } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => checkInTicket(userId, code),
    // The ticket belongs to someone else; mark every cached ticket list stale so the owner's badge updates.
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}
