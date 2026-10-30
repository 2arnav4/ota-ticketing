import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import type { EventSummary } from "@/api/types";
import { colors, radius, space, type } from "@/theme/tokens";
import { formatDateChip, formatEventDateTime, formatINR } from "@/utils/format";
import { BookingPanel } from "./BookingPanel";
import { StockBadge } from "./StockBadge";

export function EventCard({ event }: { event: EventSummary }) {
  const { t, i18n } = useTranslation();
  const chip = formatDateChip(event.startsAt, i18n.language);
  // The accent marks Ōta's own events among the others: a data signal, not decoration.
  const isOtaEvent = event.name.startsWith("Ōta");

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.dateChip, isOtaEvent && styles.dateChipOta]}>
          <Text style={[styles.chipMonth, isOtaEvent && styles.chipTextOta]}>{chip.month}</Text>
          <Text style={[styles.chipDay, isOtaEvent && styles.chipTextOta]}>{chip.day}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{event.name}</Text>
          <Text style={styles.meta}>
            {event.venue} · {event.city}
          </Text>
          <Text style={styles.meta}>
            {formatEventDateTime(event.startsAt, i18n.language)} {t("events.ist")}
          </Text>
        </View>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatINR(event.pricePaise)}</Text>
        <StockBadge ticketsLeft={event.ticketsLeft} />
      </View>
      <BookingPanel event={event} />
    </View>
  );
}

const styles = StyleSheet.create({
  // A border separates the card from the ground; no shadow on top of it.
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg + 2,
    gap: space.lg,
  },
  top: { flexDirection: "row", gap: space.lg, alignItems: "flex-start" },
  dateChip: {
    width: 56,
    paddingVertical: space.sm,
    borderRadius: radius.chip,
    backgroundColor: colors.neutralFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  dateChipOta: { backgroundColor: colors.accent },
  chipMonth: { fontSize: 12, fontWeight: "700", color: colors.muted },
  chipDay: { fontSize: 22, fontWeight: "700", color: colors.ink, lineHeight: 26, ...type.figure },
  chipTextOta: { color: "#FFFFFF" },
  body: { flex: 1, gap: 3 },
  name: { ...type.cardTitle, color: colors.ink, marginBottom: 2 },
  meta: { ...type.meta, color: colors.muted },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 22, fontWeight: "700", color: colors.ink, letterSpacing: -0.3, ...type.figure },
});
