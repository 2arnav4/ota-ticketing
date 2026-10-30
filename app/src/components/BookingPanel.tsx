import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import type { EventSummary, Ticket } from "@/api/types";
import {
  BOOK_MUTATION_KEY,
  type BookingVariables,
  newBookingVariables,
  usePendingBookings,
} from "@/state/bookingQueue";
import { useSession } from "@/state/session";
import { colors, radius, space, type } from "@/theme/tokens";
import { classifyError, logForDevelopers } from "@/utils/errorKind";
import { formatINR } from "@/utils/format";
import { PrimaryButton } from "./PrimaryButton";
import { QuantityStepper } from "./QuantityStepper";

const MAX_PER_BOOKING = 4;

// Branches on the API's error code, never its English message, so every case is translatable.
function bookingErrorMessage(error: unknown, t: TFunction): string {
  logForDevelopers(error);
  const result = classifyError(error);
  if (result.kind === "network") return t("errors.network");
  if (result.kind === "server") return t("errors.server");
  if (result.kind === "known") {
    if (result.code === "NOT_ENOUGH_LEFT") return t("booking.notEnough", { count: Number(result.details.ticketsLeft) });
    if (result.code === "SOLD_OUT") return t("booking.soldOut");
    if (result.code === "EVENT_STARTED") return t("booking.started");
    if (result.code === "RATE_LIMITED") return t("booking.rateLimited");
  }
  return t("booking.failed");
}

export function BookingPanel({ event }: { event: EventSummary }) {
  const { t } = useTranslation();
  const { userId } = useSession();
  const [requested, setRequested] = useState(1);
  // mutationFn, retries and outcome handling come from the defaults in state/bookingQueue.
  const book = useMutation<Ticket[], unknown, BookingVariables>({ mutationKey: BOOK_MUTATION_KEY });
  const pending = usePendingBookings(userId, event.id);

  const max = Math.min(MAX_PER_BOOKING, event.ticketsLeft);
  // Clamp on render: if stock drops below the chosen quantity after a refetch, the stepper follows it down.
  const quantity = Math.max(1, Math.min(requested, max));
  // Errors of a queued booking arrive as a banner; only an online tap shows its error here.
  const inlineError = book.isError && !book.variables?.queued ? bookingErrorMessage(book.error, t) : null;

  // A booking for this event is waiting or in flight: show that instead of offering a second one.
  if (pending.length > 0) {
    const waiting = pending.some((b) => b.waitingForNetwork);
    const count = pending.reduce((sum, b) => sum + b.quantity, 0);
    return (
      <View style={[styles.panel, styles.pendingBox]} accessibilityLiveRegion="polite">
        <Text style={styles.pendingTitle}>{t("pending.title")}</Text>
        <Text style={styles.pendingText}>
          {waiting ? t("pending.waiting", { count }) : t("pending.sending", { count })}
        </Text>
      </View>
    );
  }

  if (event.ticketsLeft === 0) {
    // Lost a race: the 409 refetch flips the card to sold out. Keep the reason visible, or the user's tap
    // seems to have done nothing.
    return (
      <View style={styles.panel}>
        {inlineError ? <Text style={styles.error}>{inlineError}</Text> : null}
        <PrimaryButton label={t("events.soldOut")} onPress={() => undefined} disabled />
      </View>
    );
  }

  const onBook = () => {
    book.mutate(newBookingVariables({ userId, eventId: event.id, eventName: event.name, quantity }), {
      onSuccess: (_tickets, variables) => {
        setRequested(1);
        // Online taps go straight to the tickets; a queued one confirms later via a banner, wherever the user is.
        if (!variables.queued) router.push("/tickets");
      },
    });
  };

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <QuantityStepper value={quantity} min={1} max={max} disabled={book.isPending} onChange={setRequested} />
        <View style={styles.total}>
          <Text style={styles.totalLabel}>{t("events.total")}</Text>
          <Text style={styles.totalValue}>{formatINR(event.pricePaise * quantity)}</Text>
        </View>
      </View>
      {inlineError ? <Text style={styles.error}>{inlineError}</Text> : null}
      {/* Disabled while pending stops double-tap double-booking in the UI. The server's guarded UPDATE is the real rule. */}
      <PrimaryButton label={t("events.bookNow")} onPress={onBook} loading={book.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  // No rule above the booking row: space and the stepper's own outline do the separating.
  panel: { gap: space.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  total: { alignItems: "flex-end" },
  totalLabel: { ...type.meta, color: colors.muted },
  totalValue: { fontSize: 17, fontWeight: "700", color: colors.ink, ...type.figure },
  error: { ...type.meta, fontSize: 14, color: colors.danger, fontWeight: "600" },
  pendingBox: {
    padding: space.md + 2,
    borderRadius: radius.chip,
    backgroundColor: colors.warningTint,
    gap: 2,
  },
  pendingTitle: { fontSize: 14, fontWeight: "700", color: colors.warning },
  pendingText: { ...type.meta, fontSize: 14, color: colors.ink },
});
