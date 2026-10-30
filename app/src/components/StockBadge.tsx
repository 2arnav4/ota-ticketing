import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space } from "@/theme/tokens";
import { formatCount } from "@/utils/format";

const LOW_STOCK_THRESHOLD = 20;

export function StockBadge({ ticketsLeft }: { ticketsLeft: number }) {
  const { t } = useTranslation();
  const tone =
    ticketsLeft === 0
      ? { fg: colors.danger, bg: colors.dangerTint, label: t("events.soldOut") }
      : ticketsLeft <= LOW_STOCK_THRESHOLD
        ? { fg: colors.warning, bg: colors.warningTint, label: t("events.onlyLeft", { n: formatCount(ticketsLeft) }) }
        : { fg: colors.success, bg: colors.successTint, label: t("events.left", { n: formatCount(ticketsLeft) }) };

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{tone.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.pill, paddingHorizontal: space.sm + 2, paddingVertical: space.xs },
  text: { fontSize: 12, fontWeight: "600" },
});
