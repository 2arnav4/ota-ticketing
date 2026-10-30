import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import type { PendingBooking } from "@/state/bookingQueue";
import { colors, radius, space, type } from "@/theme/tokens";

// A booking the server hasn't confirmed yet. Deliberately looks unlike a ticket: no QR, no code.
export function PendingBookingCard({ booking }: { booking: PendingBooking }) {
  const { t } = useTranslation();
  return (
    <View style={styles.card} accessibilityLabel={t("pending.title")}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{t("pending.title")}</Text>
      </View>
      <Text style={styles.name}>{booking.eventName}</Text>
      <Text style={styles.meta}>
        {booking.waitingForNetwork
          ? t("pending.waiting", { count: booking.quantity })
          : t("pending.sending", { count: booking.quantity })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.warning,
    padding: space.lg,
    gap: space.xs,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.warningTint,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.warning, textTransform: "uppercase", letterSpacing: 0.5 },
  name: { ...type.cardTitle, color: colors.textPrimary },
  meta: { ...type.meta, color: colors.textMuted },
});
