import type { ReactNode } from "react"
import { useEffect } from "react"
import { useTheme } from "@/lib/theme-context"
import { ACCENT_COLORS, type AccentColorKey } from "@/lib/accent-palette"
import { useAccentStore } from "@/store/accent-store"

export { ACCENT_COLORS }
export type { AccentColorKey }

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  const accentColor = useAccentStore((state) => state.accentColor)
  const secondaryColor = useAccentStore((state) => state.secondaryColor)

  useEffect(() => {
    if (typeof document === "undefined") return

    const color = ACCENT_COLORS[accentColor]
    const secondary = ACCENT_COLORS[secondaryColor]
    const isDark = resolvedTheme === "dark"
    const root = document.documentElement

    root.style.setProperty("--primary", isDark ? color.dark : color.light)
    root.style.setProperty("--primary-hover", color.hover)
    root.style.setProperty(
      "--primary-active",
      isDark ? `oklch(from ${color.dark} calc(l - 0.04) c h)` : `oklch(from ${color.light} calc(l - 0.04) c h)`
    )
    root.style.setProperty("--secondary-accent", isDark ? secondary.dark : secondary.light)
  }, [accentColor, secondaryColor, resolvedTheme])

  return <>{children}</>
}

export function useAccentColor() {
  const accentColor = useAccentStore((state) => state.accentColor)
  const secondaryColor = useAccentStore((state) => state.secondaryColor)
  const setAccentColor = useAccentStore((state) => state.setAccentColor)
  const setSecondaryColor = useAccentStore((state) => state.setSecondaryColor)

  return { accentColor, secondaryColor, setAccentColor, setSecondaryColor }
}
