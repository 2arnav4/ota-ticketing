import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useIsOnline } from "@/state/bookingQueue";
import { colors, radius, space } from "@/theme/tokens";

export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useIsOnline();
  if (online) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <View style={styles.dot} />
      <Text style={styles.text}>{t("offline.banner")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.card,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
  text: { flex: 1, color: "#FFFFFF", fontSize: 13, fontWeight: "500" },
});
