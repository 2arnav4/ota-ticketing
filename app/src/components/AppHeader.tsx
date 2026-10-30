import { StyleSheet, Text, View } from "react-native";
import { colors, space, type } from "@/theme/tokens";
import { UserSwitcher } from "./UserSwitcher";

export function AppHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.wordmark}>
          Ō<Text style={styles.wordmarkTail}>ta</Text>
        </Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <UserSwitcher />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md, gap: space.md },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: space.md },
  wordmark: { fontSize: 28, fontWeight: "800", color: colors.gradientStart },
  wordmarkTail: { color: colors.gradientEnd },
  title: { ...type.title, color: colors.textPrimary },
});
