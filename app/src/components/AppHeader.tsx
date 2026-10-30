import { StyleSheet, Text, View } from "react-native";
import { colors, layout, space, type } from "@/theme/tokens";
import { LanguagePill } from "./LanguagePill";
import { NoticeHost } from "./NoticeHost";
import { OfflineBanner } from "./OfflineBanner";
import { UserSwitcher } from "./UserSwitcher";

export function AppHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.wordmark}>
          Ō<Text style={styles.wordmarkTail}>ta</Text>
        </Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
        <LanguagePill />
      </View>
      <UserSwitcher />
      <OfflineBanner />
      <NoticeHost />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md, gap: space.md, width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  spacer: { flex: 1 },
  wordmark: { fontSize: 28, fontWeight: "800", color: colors.gradientStart },
  wordmarkTail: { color: colors.gradientEnd },
  title: { ...type.title, color: colors.textPrimary },
});
