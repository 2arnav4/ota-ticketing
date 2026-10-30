import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { DEMO_USERS } from "@/config/demoUsers";
import { useSession } from "@/state/session";
import { type PressState } from "@/utils/pressState";
import { colors, radius, space, touch } from "@/theme/tokens";

// Stand-in for login (out of scope per the brief): picks which seeded user's ID goes in X-User-Id.
// The selected chip is ink on neutral, not the accent: choosing a demo user is chrome, not data.
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
            style={({ hovered }: PressState) => [styles.chip, active ? styles.chipActive : hovered && styles.chipHover]}
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
    minHeight: touch.min - 8,
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingHorizontal: space.md + 2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  chipHover: { backgroundColor: colors.neutralFill },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  text: { fontSize: 14, color: colors.ink, fontWeight: "500" },
  textActive: { color: "#FFFFFF", fontWeight: "600" },
});
