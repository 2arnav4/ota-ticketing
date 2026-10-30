import { StyleSheet, Text, View } from "react-native";
import { colors, layout, space, type } from "@/theme/tokens";
import { LanguagePill } from "./LanguagePill";
import { NoticeHost } from "./NoticeHost";
import { OfflineBanner } from "./OfflineBanner";
import { UserSwitcher } from "./UserSwitcher";

export function AppHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Text style={styles.wordmark} accessibilityLabel="Ōta Tickets">
          Ōta
        </Text>
        <LanguagePill />
      </View>
      {/* The screen's name, as the page's h1 on web and a header for screen readers on iOS / Android. */}
      <Text role="heading" aria-level={1} style={styles.title}>
        {title}
      </Text>
      <UserSwitcher />
      <OfflineBanner />
      <NoticeHost />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    gap: space.md,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
  },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wordmark: { fontSize: 20, fontWeight: "800", color: colors.accent, letterSpacing: -0.5 },
  title: { ...type.title, color: colors.ink },
});
