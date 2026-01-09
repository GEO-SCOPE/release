/**
 * Settings Appearance - 外观设置
 * 主题、主题色、语言
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sun, Moon, Monitor, Globe, Palette } from "lucide-react"
import { useI18n, type Locale } from "@/lib/i18n"
import { localeNames } from "@/lib/i18n/types"
import { useTheme } from "@/lib/theme-context"
import { useAccentColor, AccentColorKey } from "@/lib/accent-color"
import { cn } from "@/lib/utils"

export default function SettingsAppearance() {
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const { accentColor, secondaryColor, setAccentColor, setSecondaryColor } = useAccentColor()

  const themeOptions = [
    { value: "system", label: t("settings.appearance.system"), icon: Monitor, isDark: null },
    { value: "light", label: t("settings.appearance.light"), icon: Sun, isDark: false },
    { value: "dark", label: t("settings.appearance.dark"), icon: Moon, isDark: true },
  ]

  const accentColorOptions: { value: AccentColorKey; label: string; color: string }[] = [
    { value: "purple", label: "Purple", color: "bg-[oklch(0.60_0.20_285)]" },
    { value: "blue", label: "Blue", color: "bg-[oklch(0.60_0.16_230)]" },
    { value: "teal", label: "Teal", color: "bg-[oklch(0.58_0.14_190)]" },
    { value: "green", label: "Green", color: "bg-[oklch(0.62_0.15_145)]" },
    { value: "orange", label: "Orange", color: "bg-[oklch(0.68_0.16_50)]" },
    { value: "red", label: "Red", color: "bg-[oklch(0.60_0.20_25)]" },
    { value: "pink", label: "Pink", color: "bg-[oklch(0.62_0.18_350)]" },
  ]

  return (
    <div className="space-y-6">
      {/* 主题设置 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.appearance.theme")}</CardTitle>
          <CardDescription>{t("settings.appearance.themeDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isSelected = theme === option.value

              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as "system" | "light" | "dark")}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 min-w-[100px] rounded-xl transition-all duration-200",
                    "border-2 hover:scale-[1.02]",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {/* 主题预览块 */}
                  <div
                    className={cn(
                      "w-16 h-10 rounded-lg shadow-inner overflow-hidden relative",
                      option.isDark === null
                        ? "bg-gradient-to-br from-white via-gray-300 to-gray-800"
                        : option.isDark
                          ? "bg-gradient-to-br from-gray-700 to-gray-900"
                          : "bg-gradient-to-br from-white to-gray-100"
                    )}
                  >
                    {/* 模拟窗口内容 */}
                    <div className="absolute inset-1 flex flex-col gap-0.5">
                      <div className={cn(
                        "h-1.5 w-8 rounded-full",
                        option.isDark === null ? "bg-gray-400" : option.isDark ? "bg-gray-600" : "bg-gray-300"
                      )} />
                      <div className={cn(
                        "h-1 w-6 rounded-full",
                        option.isDark === null ? "bg-gray-500" : option.isDark ? "bg-gray-700" : "bg-gray-200"
                      )} />
                      <div className={cn(
                        "h-1 w-10 rounded-full",
                        option.isDark === null ? "bg-gray-500" : option.isDark ? "bg-gray-700" : "bg-gray-200"
                      )} />
                    </div>
                  </div>

                  {/* 图标和标签 */}
                  <div className="flex items-center gap-2">
                    <Icon className={cn(
                      "h-4 w-4",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {option.label}
                    </span>
                  </div>

                  {/* 选中指示器 */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 主题色设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t("settings.appearance.accentColor")}
          </CardTitle>
          <CardDescription>{t("settings.appearance.accentColorDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* 主主题色 */}
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-4">
              {t("settings.appearance.primaryColor")}
            </label>
            <div className="flex flex-wrap gap-3">
              {accentColorOptions.map((option) => {
                const isSelected = accentColor === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setAccentColor(option.value)}
                    className={cn(
                      "w-10 h-10 rounded-full fluent-transition relative",
                      option.color,
                      isSelected && "ring-2 ring-offset-2 ring-offset-background ring-primary"
                    )}
                    title={option.label}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 第二主题色 */}
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-4">
              {t("settings.appearance.secondaryColor")}
            </label>
            <div className="flex flex-wrap gap-3">
              {accentColorOptions.map((option) => {
                const isSelected = secondaryColor === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setSecondaryColor(option.value)}
                    className={cn(
                      "w-10 h-10 rounded-full fluent-transition relative",
                      option.color,
                      isSelected && "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                    )}
                    title={option.label}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* 语言设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("settings.appearance.language")}
          </CardTitle>
          <CardDescription>{t("settings.appearance.languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={locale} onValueChange={(value: Locale) => setLocale(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(localeNames) as Locale[]).map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {localeNames[loc]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  )
}
