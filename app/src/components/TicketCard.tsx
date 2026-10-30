import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import type { Ticket } from "@/api/types";
import { colors, radius, space, type } from "@/theme/tokens";
import { formatDateAndTime, formatEventDateTime, formatTicketCode, formatTime } from "@/utils/format";

const QR_SIZE = 220;

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const used = ticket.checkedInAt !== null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.name}>{ticket.event.name}</Text>
          <Text style={styles.meta}>{formatEventDateTime(ticket.event.startsAt)} IST</Text>
          <Text style={styles.meta}>
            {ticket.event.venue}, {ticket.event.city}
          </Text>
        </View>
        {used ? (
          <View style={[styles.badge, styles.badgeUsed]}>
            <Text style={[styles.badgeText, { color: colors.success }]}>Checked in · {formatTime(ticket.checkedInAt!)}</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.badgeUnused]}>
            <Text style={[styles.badgeText, { color: colors.textMuted }]}>Not used</Text>
          </View>
        )}
      </View>

      {/* The QR holds only the 12-character code: no user or event data, nothing to tamper with. */}
      <View style={[styles.qrWrap, used && styles.qrUsed]} accessibilityLabel={`QR code for ticket ${ticket.code}`}>
        <QRCode value={ticket.code} size={QR_SIZE} backgroundColor="#FFFFFF" color="#111827" ecl="M" />
      </View>
      <Text style={styles.code} selectable>
        {formatTicketCode(ticket.code)}
      </Text>
      {used ? <Text style={styles.usedNote}>Used on {formatDateAndTime(ticket.checkedInAt!)}</Text> : null}
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
    alignItems: "center",
  },
  header: { flexDirection: "row", alignSelf: "stretch", gap: space.md, alignItems: "flex-start" },
  headerText: { flex: 1, gap: 2 },
  name: { ...type.cardTitle, color: colors.textPrimary },
  meta: { ...type.meta, color: colors.textMuted },
  badge: { borderRadius: radius.pill, paddingHorizontal: space.sm + 2, paddingVertical: space.xs },
  badgeUsed: { backgroundColor: colors.successTint },
  badgeUnused: { backgroundColor: colors.chipIdle },
  badgeText: { fontSize: 12, fontWeight: "600" },
  qrWrap: { padding: space.md, backgroundColor: "#FFFFFF", borderRadius: radius.card },
  qrUsed: { opacity: 0.4 },
  code: { fontFamily: "monospace", fontSize: 18, fontWeight: "700", letterSpacing: 2, color: colors.textPrimary },
  usedNote: { ...type.meta, color: colors.textMuted },
});
