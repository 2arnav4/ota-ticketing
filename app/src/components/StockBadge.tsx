import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space } from "@/theme/tokens";
import { formatCount } from "@/utils/format";

const LOW_STOCK_THRESHOLD = 20;

export function StockBadge({ ticketsLeft }: { ticketsLeft: number }) {
  const tone =
    ticketsLeft === 0
      ? { fg: colors.danger, bg: colors.dangerTint, label: "Sold out" }
      : ticketsLeft <= LOW_STOCK_THRESHOLD
        ? { fg: colors.warning, bg: colors.warningTint, label: `Only ${formatCount(ticketsLeft)} left` }
        : { fg: colors.success, bg: colors.successTint, label: `${formatCount(ticketsLeft)} left` };

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
