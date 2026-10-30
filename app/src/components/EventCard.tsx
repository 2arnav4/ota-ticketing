import { StyleSheet, Text, View } from "react-native";
import type { EventSummary } from "@/api/types";
import { colors, radius, space, type } from "@/theme/tokens";
import { formatDateChip, formatEventDateTime, formatINR } from "@/utils/format";
import { BookingPanel } from "./BookingPanel";
import { StockBadge } from "./StockBadge";

export function EventCard({ event }: { event: EventSummary }) {
  const chip = formatDateChip(event.startsAt);
  const isOtaEvent = event.name.startsWith("Ōta");

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dateChip, isOtaEvent && styles.dateChipOta]}>
          <Text style={[styles.chipDay, isOtaEvent && styles.chipTextOta]}>{chip.day}</Text>
          <Text style={[styles.chipMonth, isOtaEvent && styles.chipTextOta]}>{chip.month}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{event.name}</Text>
          <Text style={styles.meta}>
            {event.venue}, {event.city}
          </Text>
          <Text style={styles.meta}>{formatEventDateTime(event.startsAt)} IST</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.price}>{formatINR(event.pricePaise)}</Text>
        <StockBadge ticketsLeft={event.ticketsLeft} />
      </View>
      <BookingPanel event={event} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: { flexDirection: "row", gap: space.md },
  dateChip: {
    width: 52,
    borderRadius: 10,
    backgroundColor: colors.chipIdle,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: space.sm,
  },
  dateChipOta: { backgroundColor: colors.eventAccent },
  chipDay: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  chipMonth: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  chipTextOta: { color: "#FFFFFF" },
  body: { flex: 1, gap: 2 },
  name: { ...type.cardTitle, color: colors.textPrimary },
  meta: { ...type.meta, color: colors.textMuted },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 17, fontWeight: "700", color: colors.price },
});
