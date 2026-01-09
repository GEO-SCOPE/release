/**
 * I18n Types
 */

export type Locale = "en" | "zh" | "ja" | "ko" | "fr" | "de" | "es"

// Locale display names for UI
export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "简体中文",
  ja: "日本語",
  ko: "한국어",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
}

export type TranslationParams = Record<string, string | number>

export interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: TranslationParams) => string
}

export type TranslationKey = string
export type Translations = Record<TranslationKey, string>
export type AllTranslations = Record<Locale, Translations>
