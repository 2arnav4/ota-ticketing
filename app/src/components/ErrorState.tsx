import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, NetworkError } from "@/api/client";
import { colors, radius, space, type } from "@/theme/tokens";

function useDescribe(): (error: unknown) => string {
  const { t } = useTranslation();
  return (error) => {
    if (error instanceof NetworkError) return t("errors.network", { url: error.url });
    if (error instanceof ApiError) return error.message;
    return t("errors.generic");
  };
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation();
  const describe = useDescribe();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("errors.title")}</Text>
      <Text style={styles.message}>{describe(error)}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
        <Text style={styles.buttonText}>{t("errors.retry")}</Text>
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
