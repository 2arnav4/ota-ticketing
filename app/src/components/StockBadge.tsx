import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme/tokens";
import { formatCount } from "@/utils/format";

const LOW_STOCK_THRESHOLD = 20;

// Colour only where it means something: plenty is neutral, low is amber, none is red.
export function StockBadge({ ticketsLeft }: { ticketsLeft: number }) {
  const { t } = useTranslation();
  const tone =
    ticketsLeft === 0
      ? { fg: colors.danger, bg: colors.dangerTint, label: t("events.soldOut") }
      : ticketsLeft <= LOW_STOCK_THRESHOLD
        ? { fg: colors.warning, bg: colors.warningTint, label: t("events.onlyLeft", { n: formatCount(ticketsLeft) }) }
        : { fg: colors.muted, bg: colors.neutralFill, label: t("events.left", { n: formatCount(ticketsLeft) }) };

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{tone.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.pill, paddingHorizontal: space.sm + 2, paddingVertical: 3 },
  text: { fontSize: 13, fontWeight: "600", ...type.figure },
});
