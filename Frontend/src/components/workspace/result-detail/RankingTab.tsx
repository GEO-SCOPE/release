import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Trophy, CheckCircle2, XCircle, AlertTriangle,
  Sparkles, RotateCcw, Lightbulb
} from "lucide-react"
import type { SimulationResult, CompetitorAnalysis } from "@/lib/api"

interface RankingTabProps {
  result: SimulationResult
  competitorAnalysis: CompetitorAnalysis | null
  isAnalyzing: boolean
  onGenerateAnalysis: () => void
  t: (key: string) => string
}

export function RankingTab({
  result,
  competitorAnalysis,
  isAnalyzing,
  onGenerateAnalysis,
  t
}: RankingTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h3 className="font-semibold">{t("workspace.rankingAnalysis")}</h3>
      </div>

      {/* Ranking Status */}
      <div className="grid grid-cols-2 gap-4">
        <Card disableBackdrop>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">
              {result.brand_mentioned ? (
                <span className="text-green-600 dark:text-green-400">
                  {result.ranking ? `#${result.ranking}` : t("workspace.mentioned")}
                </span>
              ) : (
                <span className="text-muted-foreground text-lg">{t("workspace.notIndexed")}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t("workspace.brandRanking")}</p>
          </CardContent>
        </Card>
        <Card disableBackdrop>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">
              {result.competitor_mentioned ? t("workspace.yes") : t("workspace.no")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t("workspace.competitorMention")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Brand Status */}
      <Card disableBackdrop>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            {result.brand_mentioned ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            )}
            <span className="text-sm font-semibold">
              {result.brand_mentioned ? t("workspace.brandExposedStatus") : t("workspace.brandNotMentioned")}
            </span>
          </div>
          {result.ranking && (
            <p className="text-sm text-muted-foreground">
              {t("workspace.rankedAt")} <span className="font-bold text-primary">{result.ranking}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* CRITICAL: Competitor mentioned but we're not - High Risk */}
      {result.competitor_mentioned && !result.brand_mentioned && (
        <CriticalRiskCard result={result} t={t} />
      )}

      {/* WARNING: Competitor mentioned and we're also mentioned */}
      {result.competitor_mentioned && result.brand_mentioned && result.competitors_mentioned && result.competitors_mentioned.length > 0 && (
        <CompetitorCoAppearCard result={result} t={t} />
      )}

      {/* AI Competitor Gap Analysis */}
      {result.competitor_mentioned && (
        <AIAnalysisCard
          competitorAnalysis={competitorAnalysis}
          isAnalyzing={isAnalyzing}
          onGenerateAnalysis={onGenerateAnalysis}
          t={t}
        />
      )}
    </div>
  )
}

function CriticalRiskCard({ result, t }: { result: SimulationResult; t: (key: string) => string }) {
  return (
    <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800" disableBackdrop>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
            {t("workspace.criticalRisk")}
          </p>
        </div>
        <p className="text-xs text-orange-600 dark:text-orange-400">
          {t("workspace.criticalRiskDesc")}
        </p>
        {result.competitors_mentioned && result.competitors_mentioned.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-orange-700 dark:text-orange-300">{t("workspace.competitorsAppeared")}：</p>
            <div className="flex flex-wrap gap-2">
              {result.competitors_mentioned.map((comp, idx) => (
                <Badge key={idx} variant="solid-destructive" className="text-xs">
                  {comp}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CompetitorCoAppearCard({ result, t }: { result: SimulationResult; t: (key: string) => string }) {
  return (
    <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700" disableBackdrop>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {t("workspace.competitorCoAppear")}
          </p>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {t("workspace.competitorCoAppearDesc")}
          {result.ranking === 1 ? ` ${t("workspace.rankedFirst")}` : ` ${t("workspace.analyzeCompetitor")}`}
        </p>
        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">{t("workspace.coAppearedCompetitors")}：</p>
          <div className="flex flex-wrap gap-2">
            {result.competitors_mentioned?.map((comp, idx) => (
              <Badge key={idx} variant="solid-warning" className="text-xs">
                {comp}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AIAnalysisCard({
  competitorAnalysis,
  isAnalyzing,
  onGenerateAnalysis,
  t
}: {
  competitorAnalysis: CompetitorAnalysis | null
  isAnalyzing: boolean
  onGenerateAnalysis: () => void
  t: (key: string) => string
}) {
  // 调试日志
  console.log("[AIAnalysisCard] Render - competitorAnalysis:", competitorAnalysis ? "有数据" : "null", "isAnalyzing:", isAnalyzing)

  return (
    <Card className="mt-4 border-2 border-primary/20" disableBackdrop disableSpotlight>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("workspace.aiCompetitorAnalysis")}
          </CardTitle>
          {!competitorAnalysis && (
            <Button
              onClick={onGenerateAnalysis}
              disabled={isAnalyzing}
              size="sm"
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  {t("workspace.generating")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("workspace.generateDeepAnalysis")}
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {competitorAnalysis ? (
          <CompetitorAnalysisContent analysis={competitorAnalysis} t={t} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm mb-2">{t("workspace.clickToGenerate")}</p>
            <p className="text-xs">{t("workspace.aiWillAnalyze")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CompetitorAnalysisContent({ analysis, t }: { analysis: CompetitorAnalysis; t: (key: string) => string }) {
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" disableBackdrop disableSpotlight>
        <CardContent className="p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">{t("workspace.coreFindings")}</p>
          <p className="text-sm text-blue-800 dark:text-blue-200">{analysis.executive_summary}</p>
        </CardContent>
      </Card>

      {/* Competitor Details */}
      {analysis.competitor_details.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-600" />
            {t("workspace.competitorCitationAnalysis")}
          </h4>
          <div className="space-y-3">
            {analysis.competitor_details.map((comp, idx) => (
              <Card key={idx} disableBackdrop disableSpotlight>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium">{comp.name}</span>
                    <div className="flex gap-1">
                      {comp.strength_areas.map((area, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{area}</Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{comp.mention_context}</p>
                  {comp.citation_sources.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {comp.citation_sources.map((source, i) => (
                        <Card key={i} disableBackdrop disableSpotlight>
                          <CardContent className="p-2 text-xs">
                            <div className="font-medium">{source.source_title}</div>
                            <div className="text-muted-foreground mt-1">{source.reason_cited}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Content Gaps */}
      <ContentGapsSection gaps={analysis.content_gaps} t={t} />

      {/* Recommendations */}
      <RecommendationsSection recommendations={analysis.recommendations} t={t} />
    </div>
  )
}

function ContentGapsSection({ gaps, t }: { gaps: CompetitorAnalysis['content_gaps']; t: (key: string) => string }) {
  return (
    <div>
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        {t("workspace.contentGapAnalysis")}
      </h4>
      <div className="space-y-3">
        {gaps.missing_topics.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">{t("workspace.missingTopics")}:</p>
            <div className="space-y-2">
              {gaps.missing_topics.map((topic, idx) => (
                <Card key={idx} className="border-l-2 border-l-orange-500 bg-orange-50 dark:bg-orange-950/30" disableBackdrop disableSpotlight>
                  <CardContent className="p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{topic.topic}</span>
                      <Badge variant={topic.importance === "high" ? "destructive" : topic.importance === "medium" ? "default" : "outline"} className="text-xs">
                        {topic.importance === "high" ? t("workspace.highPriority") : topic.importance === "medium" ? t("workspace.mediumPriority") : t("workspace.lowPriority")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{topic.reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        {gaps.missing_sources.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">{t("workspace.missingSourceTypes")}:</p>
            <div className="grid gap-2">
              {gaps.missing_sources.map((source, idx) => (
                <Card key={idx} disableBackdrop disableSpotlight>
                  <CardContent className="p-2 text-xs">
                    <div className="font-medium">{source.source_type}</div>
                    <div className="text-muted-foreground mt-1">{source.impact}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RecommendationsSection({ recommendations, t }: { recommendations: CompetitorAnalysis['recommendations']; t: (key: string) => string }) {
  return (
    <div>
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-green-600" />
        {t("workspace.optimizationSuggestions")}
      </h4>
      <div className="space-y-3">
        {recommendations.quick_wins.length > 0 && (
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" disableBackdrop disableSpotlight>
            <CardContent className="p-3">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">⚡ {t("workspace.quickWins")}</p>
              <div className="space-y-2">
                {recommendations.quick_wins.map((win, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="font-medium">{win.action}</div>
                    <div className="text-muted-foreground mt-1">{win.implementation}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {recommendations.high_priority.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">{t("workspace.highPrioritySuggestions")}:</p>
            <div className="space-y-2">
              {recommendations.high_priority.map((rec, idx) => (
                <Card key={idx} disableBackdrop disableSpotlight>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium flex-1">{rec.action}</span>
                      <Badge variant="outline" className="text-xs">{rec.effort === "low" ? t("workspace.easy") : rec.effort === "medium" ? t("workspace.medium") : t("workspace.hard")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.rationale}</p>
                    {rec.estimated_impact && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t("workspace.expectedImpact")}: {rec.estimated_impact}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
