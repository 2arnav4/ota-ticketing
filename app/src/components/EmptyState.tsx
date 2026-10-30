import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme/tokens";

type Props = { title: string; message: string; actionLabel: string; onAction: () => void };

export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    gap: space.sm,
    alignItems: "center",
  },
  title: { ...type.cardTitle, color: colors.textPrimary },
  message: { ...type.meta, color: colors.textMuted, textAlign: "center" },
  button: {
    marginTop: space.sm,
    backgroundColor: colors.chipActive,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  buttonText: { color: colors.textPrimary, fontWeight: "600" },
});
