import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ja from "./ja.json";

export const LANGUAGES = ["en", "ja"] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = "ota.language";

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

function deviceLanguage(): Language {
  return getLocales()[0]?.languageCode === "ja" ? "ja" : "en";
}

// Starts in the device language synchronously so the first frame is already translated, then applies a saved
// override if there is one. Event names and venues are data, not UI strings, and stay as stored.
// Own instance (not the i18next default singleton); initReactI18next registers it for useTranslation.
const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ja: { translation: ja } },
  lng: deviceLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export async function restoreSavedLanguage(): Promise<void> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  if (isLanguage(saved) && saved !== i18n.language) {
    await i18n.changeLanguage(saved);
  }
}

export function setLanguage(language: Language): void {
  void i18n.changeLanguage(language);
  AsyncStorage.setItem(STORAGE_KEY, language).catch(() => {
    // Losing the saved choice only means the device language on next launch.
  });
}

export default i18n;
