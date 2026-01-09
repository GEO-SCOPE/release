
import { useAccentColor, ACCENT_COLORS, AccentColorKey } from "@/lib/accent-color"
import { Button } from "@/components/ui/button"
import { CheckIcon } from "@/components/icons"

export function AccentColorPicker() {
  const { accentColor, setAccentColor } = useAccentColor()

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Accent Color</h3>
      <div className="grid grid-cols-7 gap-2">
        {Object.entries(ACCENT_COLORS).map(([key, color]) => {
          const isSelected = accentColor === key
          const colorKey = key as AccentColorKey

          return (
            <Button
              key={key}
              variant="color-swatch"
              data-state={isSelected ? "on" : "off"}
              onClick={() => setAccentColor(colorKey)}
              className="h-10 w-10 rounded-md p-0"
              style={{
                backgroundColor: color.light,
              }}
              aria-label={`Select ${color.name} accent color`}
            >
              {isSelected && (
                <CheckIcon className="h-5 w-5 text-white drop-shadow-lg" />
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
