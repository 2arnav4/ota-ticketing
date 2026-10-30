import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import type { Ticket } from "@/api/types";
import { colors, radius, space, type } from "@/theme/tokens";
import { formatDateAndTime, formatEventDateTime, formatTicketCode, formatTime } from "@/utils/format";

const QR_SIZE = 200;
const NOTCH = 18;

// Shaped like a paper ticket: the event on top, the stub with the QR below, with notches where it would tear.
// The notches are cut-outs in the screen's ground colour; the stub is one tone step darker. No dividing line.
export function TicketCard({ ticket }: { ticket: Ticket }) {
  const { t, i18n } = useTranslation();
  const used = ticket.checkedInAt !== null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.name}>{ticket.event.name}</Text>
        <Text style={styles.meta}>
          {formatEventDateTime(ticket.event.startsAt, i18n.language)} {t("events.ist")}
        </Text>
        <Text style={styles.meta}>
          {ticket.event.venue} · {ticket.event.city}
        </Text>
        {/* Under the details, not beside them: beside, it squeezed the date onto two lines on a phone. */}
        <View style={[styles.badge, used ? styles.badgeUsed : styles.badgeUnused]}>
          <Text style={[styles.badgeText, { color: used ? colors.success : colors.muted }]}>
            {used ? t("tickets.checkedIn", { time: formatTime(ticket.checkedInAt!, i18n.language) }) : t("tickets.notUsed")}
          </Text>
        </View>
      </View>

      <View style={styles.tear}>
        <View style={[styles.notch, styles.notchLeft]} />
        <View style={[styles.notch, styles.notchRight]} />
      </View>

      <View style={styles.stub}>
        {/* The QR holds only the 12-character code: no user or event data, nothing to tamper with. */}
        <View
          style={[styles.qrWrap, used && styles.qrUsed]}
          accessibilityLabel={t("tickets.qrLabel", { code: ticket.code })}
        >
          <QRCode value={ticket.code} size={QR_SIZE} backgroundColor="#FFFFFF" color={colors.ink} ecl="M" />
        </View>
        <Text style={styles.code} selectable>
          {formatTicketCode(ticket.code)}
        </Text>
        {used ? (
          <Text style={styles.usedNote}>{t("tickets.usedOn", { when: formatDateAndTime(ticket.checkedInAt!, i18n.language) })}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  head: { gap: 3, padding: space.lg + 2 },
  name: { ...type.cardTitle, color: colors.ink, marginBottom: 2 },
  meta: { ...type.meta, color: colors.muted },
  badge: { alignSelf: "flex-start", marginTop: space.sm, borderRadius: radius.pill, paddingHorizontal: space.sm + 2, paddingVertical: 3 },
  badgeUsed: { backgroundColor: colors.successTint },
  badgeUnused: { backgroundColor: colors.neutralFill },
  badgeText: { fontSize: 13, fontWeight: "600", ...type.figure },
  tear: { height: 0, position: "relative" },
  notch: {
    position: "absolute",
    top: -NOTCH / 2,
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: colors.ground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notchLeft: { left: -NOTCH / 2 },
  notchRight: { right: -NOTCH / 2 },
  stub: { backgroundColor: colors.surfaceSunken, alignItems: "center", gap: space.md, padding: space.xl },
  qrWrap: { padding: space.md, backgroundColor: "#FFFFFF", borderRadius: radius.chip },
  qrUsed: { opacity: 0.35 },
  code: { fontSize: 18, fontWeight: "700", letterSpacing: 2, color: colors.ink, ...type.figure },
  usedNote: { ...type.meta, color: colors.muted },
});
