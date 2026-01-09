import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Link2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SimulationResult } from "@/lib/api"
import { SentimentBadge } from "./SentimentBadge"
import { getEngineById } from "./constants"

interface ResultCardProps {
  result: SimulationResult
  onClick: () => void
  t: (key: string) => string
  /** 禁用 hover 效果，在虚拟化列表中使用以提升滚动性能 */
  disableHover?: boolean
  /** 禁用 backdrop blur 效果，在虚拟化列表中必须禁用以避免渲染问题 */
  disableBackdrop?: boolean
}

export function ResultCard({ result, onClick, t, disableHover = false, disableBackdrop = false }: ResultCardProps) {
  const engine = getEngineById(result.engine)
  const isDangerous = result.competitor_mentioned && !result.brand_mentioned
  const citationCount = result.citations?.length ?? 0
  const riskCount = result.risk_flags?.length ?? 0

  return (
    <Card
      className={cn(
        "cursor-pointer",
        !disableHover && "hover:shadow-md transition-shadow",
        isDangerous && "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800"
      )}
      onClick={onClick}
      disableBackdrop={isDangerous || disableBackdrop}
    >
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm border flex-shrink-0">
            <img src={engine?.icon} alt={engine?.name} className="h-7 w-7 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{engine?.name}</span>
              <Badge variant="outline" className="text-xs">
                {result.channel === "search" ? t("workspace.search") : t("workspace.chat")}
              </Badge>
              <SentimentBadge sentiment={result.sentiment} t={t} />
              {isDangerous && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {t("workspace.danger")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {result.simulated_response.slice(0, 150)}...
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {result.brand_mentioned && (
                <span className="flex items-center gap-1 text-green-600">
                  <Eye className="h-3 w-3" />
                  {t("workspace.brandExposed")}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {citationCount} {t("workspace.citations")}
              </span>
              {riskCount > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  {riskCount} {t("workspace.risk")}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold">{result.visibility_score}</p>
            <p className="text-xs text-muted-foreground">{t("workspace.exposureScore")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
