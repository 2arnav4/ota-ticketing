import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { dismissNotice, type Notice, useNotices } from "@/state/notices";
import { colors, radius, space } from "@/theme/tokens";

function message(notice: Notice, t: TFunction): string {
  if (notice.kind === "booked") return t("notice.booked", { count: notice.count, event: notice.eventName });
  if (notice.code === "SOLD_OUT") return t("notice.soldOut", { event: notice.eventName });
  if (notice.code === "NOT_ENOUGH_LEFT") return t("notice.notEnough", { event: notice.eventName, count: notice.ticketsLeft });
  if (notice.code === "EVENT_STARTED") return t("notice.started", { event: notice.eventName });
  return t("notice.failed", { event: notice.eventName });
}

// Outcomes of bookings that finished in the background (e.g. a queued booking sent after reconnecting).
export function NoticeHost() {
  const { t } = useTranslation();
  const notices = useNotices();
  if (notices.length === 0) return null;
  return (
    <View style={styles.stack} accessibilityLiveRegion="polite">
      {notices.map((notice) => {
        const ok = notice.kind === "booked";
        return (
          <Pressable
            key={notice.id}
            accessibilityRole="button"
            accessibilityHint={t("banner.dismiss")}
            onPress={() => dismissNotice(notice.id)}
            style={[styles.notice, { backgroundColor: ok ? colors.successTint : colors.dangerTint }]}
          >
            <Text style={[styles.text, { color: ok ? colors.success : colors.danger }]}>{message(notice, t)}</Text>
            <Text style={[styles.close, { color: ok ? colors.success : colors.danger }]}>✕</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.sm },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.card,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    gap: space.md,
  },
  text: { flex: 1, fontSize: 14, fontWeight: "600" },
  close: { fontWeight: "700" },
});
