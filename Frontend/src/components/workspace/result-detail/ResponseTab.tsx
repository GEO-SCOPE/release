import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, AlertTriangle, Link2 } from "lucide-react"
import { toast } from "sonner"
import type { SimulationResult } from "@/lib/api"
import { SentimentBadge } from "../SentimentBadge"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { processCitationMarkers } from "../utils"

interface ResponseTabProps {
  result: SimulationResult
  t: (key: string) => string
}

export function ResponseTab({ result, t }: ResponseTabProps) {
  const handleCopyResponse = () => {
    navigator.clipboard.writeText(result.simulated_response)
    toast.success(t("workspace.copiedToClipboard"))
  }

  const citationCount = result.citations?.length ?? 0

  return (
    <div className="space-y-4">
      {/* Header with badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <SentimentBadge sentiment={result.sentiment} t={t} />
          {result.brand_mentioned ? (
            <Badge variant="solid-success">{t("workspace.brandExposed")}</Badge>
          ) : result.competitor_mentioned ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {t("workspace.danger")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">{t("workspace.noBrandMention")}</Badge>
          )}
          {result.ranking && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0">
              {t("workspace.ranking")} #{result.ranking}
            </Badge>
          )}
          {citationCount > 0 && (
            <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
              {citationCount} {t("workspace.citations")}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopyResponse} className="text-muted-foreground hover:text-foreground">
          <Copy className="h-4 w-4 mr-1" />
          {t("workspace.copy")}
        </Button>
      </div>

      {/* Response content */}
      <div className="text-sm text-foreground leading-7 space-y-4">
        <MarkdownRenderer
          content={processCitationMarkers(result.simulated_response, result.citations, result.sources)}
        />
      </div>

      {/* CTA Detection */}
      {result.cta?.present && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950" tintOpacity={0} disableBackdrop>
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">
                {t("workspace.ctaDetected")}：{result.cta.target === "brand" ? t("workspace.brand") : result.cta.target === "competitor" ? t("workspace.competitor") : t("workspace.general")}
                ({result.cta.action_type})
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
