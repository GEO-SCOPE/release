/**
 * I18n Module
 * Internationalization support for GEO-SCOPE
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Locale, I18nContextType, TranslationParams } from './types'
import { translations } from './translations'

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const VALID_LOCALES: Locale[] = ["en", "zh", "ja", "ko", "fr", "de", "es"]

/**
 * 检测用户系统语言并映射到支持的语言
 */
function getSystemLocale(): Locale {
  if (typeof navigator === "undefined") return "en"

  // navigator.language 返回如 "zh-CN", "en-US", "ja" 等
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || "en"
  const langCode = browserLang.split("-")[0].toLowerCase()

  // 映射到支持的语言
  if (langCode === "zh") return "zh"
  if (langCode === "ja") return "ja"
  if (langCode === "ko") return "ko"
  if (langCode === "fr") return "fr"
  if (langCode === "de") return "de"
  if (langCode === "es") return "es"

  return "en" // 默认英语
}

/**
 * 获取初始语言：优先 localStorage，其次系统语言
 */
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en"

  const savedLocale = localStorage.getItem("GEO-SCOPE-locale") as Locale | null
  if (savedLocale && VALID_LOCALES.includes(savedLocale)) {
    return savedLocale
  }

  return getSystemLocale()
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale())
  const [isInitialized, setIsInitialized] = useState(false)

  // Mark as initialized on mount
  useEffect(() => {
    setIsInitialized(true)
  }, [])

  // Save language preference when it changes
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("GEO-SCOPE-locale", newLocale)
  }

  const t = (key: string, params?: TranslationParams): string => {
    let text = translations[locale][key] || key
    if (params) {
      // Replace {key} and {{key}} placeholders with values
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}|\\{${paramKey}\\}`, 'g'), String(value))
      })
    }
    return text
  }

  // Don't render until initialized to prevent flash of wrong language
  if (!isInitialized) {
    return null
  }

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}

// Re-export types and translations for external use
export type { Locale, I18nContextType } from './types'
export { translations } from './translations'
