
import * as React from "react"
import { storageConfig } from "@/config"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = storageConfig.themeKey || "theme"

const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark" || value === "system"

const getSystemTheme = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

const getStoredTheme = () => {
  if (typeof window === "undefined") return "system" as Theme
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return isTheme(stored) ? stored : "system"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initialTheme = React.useMemo(() => getStoredTheme(), [])
  const initialResolved = React.useMemo(
    () => (initialTheme === "system" ? getSystemTheme() : initialTheme === "dark" ? "dark" : "light"),
    [initialTheme]
  )

  const [theme, setThemeState] = React.useState<Theme>(initialTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(initialResolved)

  React.useEffect(() => {
    const root = document.documentElement

    let effectiveTheme: "light" | "dark" = "light"

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      effectiveTheme = systemTheme
    } else {
      effectiveTheme = theme
    }

    // 使用 View Transition API 实现流畅切换（如果浏览器支持）
    const supportsViewTransitions = 'startViewTransition' in document
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const applyTheme = () => {
      root.classList.remove("light", "dark")
      root.classList.add(effectiveTheme)
      setResolvedTheme(effectiveTheme)
    }

    if (supportsViewTransitions && !prefersReducedMotion) {
      try {
        // @ts-ignore - View Transition API 还未完全支持类型
        const transition = document.startViewTransition(applyTheme)
        // Catch any abort errors silently (happens when transitions overlap)
        transition.ready.catch(() => {})
        transition.finished.catch(() => {})
      } catch {
        // Fallback if startViewTransition fails
        applyTheme()
      }
    } else {
      // 降级方案
      applyTheme()
    }

    // 设置 color-scheme 属性提升性能
    root.style.colorScheme = effectiveTheme

    // 保存到 localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  // 监听系统主题变化
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      if (theme === "system") {
        const systemTheme = mediaQuery.matches ? "dark" : "light"
        setResolvedTheme(systemTheme)
        document.documentElement.classList.remove("light", "dark")
        document.documentElement.classList.add(systemTheme)
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
