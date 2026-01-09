import { Card, CardContent } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, Minus, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SimulationResult } from "@/lib/api"

interface SentimentTabProps {
  result: SimulationResult
  t: (key: string) => string
}

export function SentimentTab({ result, t }: SentimentTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{t("workspace.sentimentAnalysis")}</h3>
      </div>

      {/* Sentiment Overview */}
      <div className="flex items-center justify-center py-6">
        <div className="text-center">
          <div className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-3",
            result.sentiment === "positive" ? "bg-green-100 dark:bg-green-900" :
            result.sentiment === "negative" ? "bg-red-100 dark:bg-red-900" :
            "bg-gray-100 dark:bg-gray-800"
          )}>
            {result.sentiment === "positive" ? (
              <ThumbsUp className="h-10 w-10 text-green-600" />
            ) : result.sentiment === "negative" ? (
              <ThumbsDown className="h-10 w-10 text-red-600" />
            ) : (
              <Minus className="h-10 w-10 text-gray-500" />
            )}
          </div>
          <p className="text-lg font-semibold">
            {result.sentiment === "positive" ? t("workspace.positiveSentiment") :
             result.sentiment === "negative" ? t("workspace.negativeSentiment") : t("workspace.neutralSentiment")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("workspace.visibilityScore")}: {result.visibility_score || 0}
          </p>
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={cn(
          "transition-all",
          result.sentiment === "positive" && "ring-2 ring-green-500"
        )} disableBackdrop>
          <CardContent className="p-4 text-center">
            <ThumbsUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-sm font-medium">{t("workspace.positive")}</p>
          </CardContent>
        </Card>
        <Card className={cn(
          "transition-all",
          result.sentiment === "neutral" && "ring-2 ring-gray-500"
        )} disableBackdrop>
          <CardContent className="p-4 text-center">
            <Minus className="h-5 w-5 text-gray-500 mx-auto mb-1" />
            <p className="text-sm font-medium">{t("workspace.neutral")}</p>
          </CardContent>
        </Card>
        <Card className={cn(
          "transition-all",
          result.sentiment === "negative" && "ring-2 ring-red-500"
        )} disableBackdrop>
          <CardContent className="p-4 text-center">
            <ThumbsDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="text-sm font-medium">{t("workspace.negative")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
