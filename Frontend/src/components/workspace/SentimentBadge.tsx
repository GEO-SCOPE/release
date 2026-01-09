import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react"

export type SentimentType = "positive" | "neutral" | "negative"

interface SentimentBadgeProps {
  sentiment: SentimentType
  t: (key: string) => string
}

const SENTIMENT_CONFIG = {
  positive: { labelKey: "workspace.positive", color: "bg-green-500", icon: ThumbsUp },
  neutral: { labelKey: "workspace.neutral", color: "bg-gray-500", icon: Minus },
  negative: { labelKey: "workspace.negative", color: "bg-red-500", icon: ThumbsDown },
} as const

export function SentimentBadge({ sentiment, t }: SentimentBadgeProps) {
  const { labelKey, color, icon: Icon } = SENTIMENT_CONFIG[sentiment]

  return (
    <Badge className={`${color} text-white flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {t(labelKey)}
    </Badge>
  )
}
