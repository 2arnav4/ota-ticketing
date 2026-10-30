import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { DEMO_USERS } from "@/config/demoUsers";
import { useSession } from "@/state/session";
import { colors, radius, space } from "@/theme/tokens";

// Stand-in for login (out of scope per the brief): picks which seeded user's ID goes in X-User-Id.
export function UserSwitcher() {
  const { userId, setUserId } = useSession();
  const { t } = useTranslation();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {DEMO_USERS.map((user) => {
        const active = user.id === userId;
        return (
          <Pressable
            key={user.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setUserId(user.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {user.name}
              {user.role === "STAFF" ? t("user.staffSuffix") : ""}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm },
  chip: {
    backgroundColor: colors.chipIdle,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm - 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: { backgroundColor: colors.chipActive, borderColor: colors.gradientStart },
  text: { fontSize: 13, color: colors.textMuted, fontWeight: "500" },
  textActive: { color: colors.textPrimary, fontWeight: "600" },
});
