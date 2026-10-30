import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, space } from "@/theme/tokens";

export function Banner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityHint="Dismiss" onPress={onDismiss} style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
      <Text style={styles.close}>✕</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.successTint,
    borderRadius: radius.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  text: { color: colors.success, fontWeight: "600", flex: 1 },
  close: { color: colors.success, fontWeight: "700", marginLeft: space.md },
});
