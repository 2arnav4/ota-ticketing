import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookTickets } from "@/api/bookings";
import { ApiError } from "@/api/client";
import { useSession } from "@/state/session";

export function useBook(eventId: string) {
  const { userId } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quantity: number) => bookTickets(userId, eventId, quantity),
    onSuccess: () => {
      // Stock changed and the user owns new tickets: both lists are stale now.
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void queryClient.invalidateQueries({ queryKey: ["tickets", userId] });
    },
    onError: (error) => {
      // Someone else bought first: refetch so the card shows the real count instead of our stale one.
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: ["events"] });
      }
    },
  });
}
