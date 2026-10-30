import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { LANGUAGES, setLanguage, type Language } from "@/i18n";
import { colors, radius, space } from "@/theme/tokens";

export function LanguagePill() {
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.pill} accessibilityRole="radiogroup" accessibilityLabel={t("language.switch")}>
      {LANGUAGES.map((language: Language) => {
        const active = i18n.language === language;
        return (
          <Pressable
            key={language}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => setLanguage(language)}
            style={[styles.option, active && styles.optionActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{t(`language.${language}`)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: "row", backgroundColor: colors.chipIdle, borderRadius: radius.pill, padding: 3 },
  option: { paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.pill },
  optionActive: { backgroundColor: colors.chipActive },
  text: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  textActive: { color: colors.textPrimary },
});
