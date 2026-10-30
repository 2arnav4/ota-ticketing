import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, NetworkError } from "@/api/client";
import { colors, radius, space, type } from "@/theme/tokens";

function describe(error: unknown): string {
  if (error instanceof NetworkError || error instanceof ApiError) {
    return error.message;
  }
  return "Something went wrong.";
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{"Couldn't load this"}</Text>
      <Text style={styles.message}>{describe(error)}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
        <Text style={styles.buttonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.dangerTint,
    padding: space.xl,
    gap: space.sm,
    alignItems: "center",
  },
  title: { ...type.cardTitle, color: colors.textPrimary },
  message: { ...type.meta, color: colors.textMuted, textAlign: "center" },
  button: {
    marginTop: space.sm,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "600" },
});
