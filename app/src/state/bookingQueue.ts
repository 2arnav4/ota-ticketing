import NetInfo from "@react-native-community/netinfo";
import { onlineManager, type QueryClient, useMutationState } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { bookTickets } from "@/api/bookings";
import type { Ticket } from "@/api/types";
import { classifyError } from "@/utils/errorKind";
import { pushNotice } from "./notices";

/**
 * Offline-safe booking.
 *
 * - While offline, React Query pauses the booking instead of failing it ("pending"); it is saved to device storage
 *   (see the persister in _layout) and sent when the connection returns, even after the app was closed.
 * - Every tap gets one idempotency key. Retries and resends reuse it, and the server answers a repeat with the
 *   original tickets, so a lost reply can never turn into a second booking.
 * - Pending is never shown as booked: the ticket list only changes when the server confirms. The outcome of a
 *   queued booking (booked, or sold out meanwhile) arrives as a banner.
 * - Overselling is still impossible: a resent booking goes through the server's same conditional stock UPDATE.
 */
export const BOOK_MUTATION_KEY = ["book"] as const;

export type BookingVariables = {
  userId: string;
  eventId: string;
  eventName: string;
  quantity: number;
  idempotencyKey: string;
  /** True when the tap happened offline; decides whether the outcome needs a banner later. */
  queued: boolean;
};

export function newBookingVariables(input: Omit<BookingVariables, "idempotencyKey" | "queued">): BookingVariables {
  return { ...input, idempotencyKey: randomUUID(), queued: !onlineManager.isOnline() };
}

const MAX_NETWORK_RETRIES = 4;
const STOCK_CODES = new Set(["SOLD_OUT", "NOT_ENOUGH_LEFT", "EVENT_STARTED"]);

// Registered on the client so a booking restored from storage after a restart still knows how to run and what
// to do with the answer: mutation functions can't be saved, only their variables.
export function registerBookingDefaults(queryClient: QueryClient): void {
  queryClient.setMutationDefaults(BOOK_MUTATION_KEY, {
    mutationFn: (v: BookingVariables) => bookTickets(v.userId, v.eventId, v.quantity, v.idempotencyKey),
    // Only a dropped connection is worth retrying, and with the same key it is safe. 4xx answers are final.
    retry: (failureCount, error) => classifyError(error).kind === "network" && failureCount < MAX_NETWORK_RETRIES,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    onSuccess: (tickets: Ticket[], v: BookingVariables) => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void queryClient.invalidateQueries({ queryKey: ["tickets", v.userId] });
      pushNotice({ kind: "booked", eventName: v.eventName, count: tickets.length });
    },
    onError: (error: unknown, v: BookingVariables) => {
      const result = classifyError(error);
      // Someone else bought first: refetch so cards show the real count instead of our stale one.
      if (result.kind === "known" && STOCK_CODES.has(result.code)) {
        void queryClient.invalidateQueries({ queryKey: ["events"] });
      }
      // A tap made online shows its error inline on the card. A queued one may finish anywhere, so tell the user.
      if (v.queued) {
        pushNotice({
          kind: "failed",
          eventName: v.eventName,
          code: result.kind === "known" ? result.code : result.kind,
          ticketsLeft: result.kind === "known" ? Number(result.details.ticketsLeft ?? NaN) : undefined,
        });
      }
    },
  });
}

// Browsers report connectivity to React Query on their own; on iOS/Android, NetInfo does.
export function connectOnlineManager(): void {
  if (Platform.OS === "web") return;
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
  );
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
    () => true,
  );
}

export type PendingBooking = BookingVariables & { submittedAt: number; waitingForNetwork: boolean };

/** Bookings not yet answered by the server, for one user (all events, or one event). */
export function usePendingBookings(userId: string, eventId?: string): PendingBooking[] {
  return useMutationState({
    filters: { mutationKey: BOOK_MUTATION_KEY, status: "pending" },
    select: (mutation) => ({
      ...(mutation.state.variables as BookingVariables),
      submittedAt: mutation.state.submittedAt,
      waitingForNetwork: mutation.state.isPaused,
    }),
  }).filter((b) => b.userId === userId && (eventId === undefined || b.eventId === eventId));
}
