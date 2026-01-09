import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import type { SimulationResult, Question, CompetitorAnalysis } from "@/lib/api"
import { competitorAnalysisApi } from "@/lib/api"
import { getEngineById, getIntentLabels } from "../constants"
import { ResponseTab } from "./ResponseTab"
import { CitationsTab } from "./CitationsTab"
import { RankingTab } from "./RankingTab"
import { SentimentTab } from "./SentimentTab"

interface ResultDetailDialogProps {
  result: SimulationResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResultUpdate?: (result: SimulationResult) => void  // 通知父组件更新 result
  question: Question | null
  t: (key: string) => string
}

export function ResultDetailDialog({
  result,
  open,
  onOpenChange,
  onResultUpdate,
  question,
  t,
}: ResultDetailDialogProps) {
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const intentLabels = getIntentLabels(t)

  // Load existing analysis if available
  useEffect(() => {
    if (!result || !open) {
      return
    }

    // Reset state when result changes
    setCompetitorAnalysis(null)

    if (result.competitor_analysis) {
      setCompetitorAnalysis(result.competitor_analysis)
    } else if (result.competitor_mentioned) {
      // Try to fetch existing analysis
      let cancelled = false
      competitorAnalysisApi.get(result.id).then(analysis => {
        if (!cancelled && analysis) {
          setCompetitorAnalysis(analysis)
        }
      }).catch(() => {
        // Ignore errors
      })

      return () => {
        cancelled = true
      }
    }
  }, [result, open])

  const handleGenerateAnalysis = useCallback(async () => {
    if (!result) return

    setIsAnalyzing(true)
    try {
      console.log("[AI Analysis] Starting analysis for result:", result.id)
      const analysis = await competitorAnalysisApi.analyze(result.id)
      console.log("[AI Analysis] Received analysis:", analysis)

      if (analysis) {
        setCompetitorAnalysis(analysis)
        console.log("[AI Analysis] State updated with analysis")

        // 通知父组件更新 result 对象，这样关闭再打开 Dialog 时也能显示结果
        if (onResultUpdate) {
          onResultUpdate({
            ...result,
            competitor_analysis: analysis,
          })
        }
        toast.success(t("workspace.aiAnalysisComplete"))
      } else {
        console.warn("[AI Analysis] Analysis returned null/undefined")
        toast.error(t("workspace.analysisError") + ": Empty response")
      }
    } catch (error) {
      console.error("[AI Analysis] Error:", error)
      toast.error(t("workspace.analysisError") + ": " + (error as Error).message)
    } finally {
      setIsAnalyzing(false)
    }
  }, [result, t, onResultUpdate])

  if (!result) return null

  const engine = getEngineById(result.engine)
  const intentLabel = question ? intentLabels[question.intent] : null
  const sourceCount = result.sources?.length ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[85vh] max-h-[85vh] overflow-hidden flex flex-col sm:max-w-5xl lg:max-w-6xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm border">
              <img src={engine?.icon} alt={engine?.name} className="h-6 w-6 object-contain" />
            </div>
            <span>{engine?.name} {t("workspace.responseDetails")}</span>
          </DialogTitle>
          {question && (
            <div className="pt-1 space-y-2">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Question:</span>{" "}
                <span className="break-words">{question.text}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {intentLabel && (
                  <Badge variant="secondary" className="text-xs">
                    {intentLabel}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {question.persona_role}
                </Badge>
                {question.keyword && (
                  <Badge variant="outline" className="text-xs">
                    {question.keyword}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="response" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="flex-shrink-0">
            <TabsTrigger value="response">{t("workspace.aiResponse")}</TabsTrigger>
            <TabsTrigger value="citations">{t("workspace.citationSources")} ({sourceCount})</TabsTrigger>
            <TabsTrigger value="ranking">{t("workspace.rankingAnalysis")}</TabsTrigger>
            <TabsTrigger value="sentiment">{t("workspace.sentimentAnalysis")}</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            <TabsContent value="response" className="m-0">
              <ResponseTab result={result} t={t} />
            </TabsContent>

            <TabsContent value="citations" className="m-0">
              <CitationsTab result={result} t={t} />
            </TabsContent>

            <TabsContent value="ranking" className="m-0">
              <RankingTab
                result={result}
                competitorAnalysis={competitorAnalysis}
                isAnalyzing={isAnalyzing}
                onGenerateAnalysis={handleGenerateAnalysis}
                t={t}
              />
            </TabsContent>

            <TabsContent value="sentiment" className="m-0">
              <SentimentTab result={result} t={t} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
