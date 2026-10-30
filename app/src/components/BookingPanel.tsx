import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { EventSummary } from "@/api/types";
import { useBook } from "@/hooks/useBook";
import { colors, space, type } from "@/theme/tokens";
import { classifyError, logForDevelopers } from "@/utils/errorKind";
import { formatINR } from "@/utils/format";
import { GradientButton } from "./GradientButton";
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
  const [requested, setRequested] = useState(1);
  const book = useBook(event.id);

  const max = Math.min(MAX_PER_BOOKING, event.ticketsLeft);
  // Clamp on render: if stock drops below the chosen quantity after a refetch, the stepper follows it down.
  const quantity = Math.max(1, Math.min(requested, max));

  if (event.ticketsLeft === 0) {
    return <GradientButton label={t("events.soldOut")} onPress={() => undefined} disabled />;
  }

  const onBook = () => {
    book.mutate(quantity, {
      onSuccess: (tickets) => {
        setRequested(1);
        router.push({ pathname: "/tickets", params: { booked: String(tickets.length) } });
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
      {book.isError ? <Text style={styles.error}>{bookingErrorMessage(book.error, t)}</Text> : null}
      {/* Disabled while pending stops double-tap double-booking in the UI. The server's guarded UPDATE is the real rule. */}
      <GradientButton label={t("events.bookNow")} onPress={onBook} loading={book.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  total: { alignItems: "flex-end" },
  totalLabel: { ...type.meta, color: colors.textMuted },
  totalValue: { fontSize: 18, fontWeight: "700", color: colors.price },
  error: { ...type.meta, color: colors.danger, fontWeight: "600" },
});
