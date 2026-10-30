import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { colors, radius, space } from "@/theme/tokens";

export function EventCardSkeleton() {
  const { t } = useTranslation();
  return (
    <View style={styles.card} accessibilityLabel={t("errors.loading")}>
      <View style={styles.row}>
        <View style={styles.chip} />
        <View style={styles.lines}>
          <View style={[styles.line, { width: "70%" }]} />
          <View style={[styles.line, { width: "50%" }]} />
          <View style={[styles.line, { width: "40%" }]} />
        </View>
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
    padding: space.lg,
  },
  row: { flexDirection: "row", gap: space.md },
  chip: { width: 52, height: 56, borderRadius: 10, backgroundColor: colors.chipIdle },
  lines: { flex: 1, gap: space.sm, justifyContent: "center" },
  line: { height: 12, borderRadius: 6, backgroundColor: colors.chipIdle },
});
