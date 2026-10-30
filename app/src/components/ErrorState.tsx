import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { classifyError, logForDevelopers } from "@/utils/errorKind";
import { colors, radius, space, type } from "@/theme/tokens";

function useDescribe(): (error: unknown) => string {
  const { t } = useTranslation();
  return (error) => {
    logForDevelopers(error);
    const { kind } = classifyError(error);
    if (kind === "network") return t("errors.network");
    if (kind === "server") return t("errors.server");
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
  title: { ...type.cardTitle, color: colors.ink },
  message: { ...type.meta, color: colors.muted, textAlign: "center" },
  button: {
    minHeight: 44,
    justifyContent: "center",
    marginTop: space.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "600" },
});
