import { useState, useEffect, useRef } from "react"
import { Languages, Check } from "lucide-react"
import { useI18n, type Locale } from "@/lib/i18n"
import { localeNames } from "@/lib/i18n/types"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  isMobile?: boolean
}

export function LanguageSwitcher({ isMobile = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  if (isMobile) {
    // Mobile: Full width buttons in a list
    return (
      <div className="w-full">
        <div className="px-2 mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          {t("mobileMenu.language")}
        </div>
        <div className="space-y-1">
          {(Object.keys(localeNames) as Locale[]).map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-left text-sm transition-colors flex items-center justify-between",
                locale === loc
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <span>{localeNames[loc]}</span>
              {locale === loc && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Desktop: Dropdown menu
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Change language"
      >
        <Languages className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 z-50 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg overflow-hidden">
            {(Object.keys(localeNames) as Locale[]).map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between",
                  locale === loc
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <span>{localeNames[loc]}</span>
                {locale === loc && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
