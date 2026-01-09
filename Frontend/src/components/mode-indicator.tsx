/**
 * Mode Indicator Component
 * Shows the current application mode (mock/develop/release) in the UI
 * Only visible in mock and develop modes based on config.features.enableMockBanner
 */

import { appConfig, features } from "@/config"

export function ModeIndicator() {
  // Don't show in release mode or when banner is disabled
  if (!features.enableMockBanner && !features.showDevTools) {
    return null
  }

  const modeStyles: Record<string, { bg: string; text: string; label: string }> = {
    mock: {
      bg: "bg-amber-500/90",
      text: "text-amber-950",
      label: "MOCK MODE",
    },
    develop: {
      bg: "bg-blue-500/90",
      text: "text-white",
      label: "DEV MODE",
    },
    test: {
      bg: "bg-purple-500/90",
      text: "text-white",
      label: "TEST MODE",
    },
    release: {
      bg: "bg-green-500/90",
      text: "text-white",
      label: "PRODUCTION",
    },
  }

  const style = modeStyles[appConfig.mode]
  if (!style) {
    return null
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg ${style.bg} ${style.text}`}
    >
      {style.label}
    </div>
  )
}
