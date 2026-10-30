import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
  pill: { flexDirection: "row", backgroundColor: colors.neutralFill, borderRadius: radius.pill, padding: 3 },
  option: { minHeight: 32, justifyContent: "center", paddingHorizontal: space.md, borderRadius: radius.pill },
  optionActive: { backgroundColor: colors.surface },
  text: { fontSize: 13, fontWeight: "600", color: colors.muted },
  textActive: { color: colors.ink },
});
