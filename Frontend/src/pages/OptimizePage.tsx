/**
 * GEO-SCOPE Optimize Page
 * P0: 按六大旅程分类的优化建议
 * Target Customer: e签宝 (电子合约 B2B)
 */

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Megaphone,
  Trophy,
  Scale,
  Shield,
  Phone,
  ChevronRight,
  AlertCircle,
  Eye,
  TrendingDown,
  ExternalLink,
  Loader2
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n"
import { AnimatedCard } from "@/components/magic/animated-card"
import { useNavigate } from "react-router-dom"
import { useProjectStore } from "@/store/project-store"
import { optimizationApi } from "@/api"
import { OptimizationDetailDialog } from "@/components/optimize"
import type { JourneyType, JourneyOptimization } from "@/api/types"

// 六大旅程定义
const JOURNEYS: {
  type: JourneyType
  name_zh: string
  name_en: string
  icon: React.ElementType
  color: string
  bgColor: string
  description_zh: string
  description_en: string
}[] = [
  {
    type: "AWARE",
    name_zh: "认知优化",
    name_en: "Awareness",
    icon: Search,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description_zh: "场景化建立首选联想",
    description_en: "Build first-choice associations",
  },
  {
    type: "RECOMMEND",
    name_zh: "推荐优化",
    name_en: "Recommendation",
    icon: Megaphone,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description_zh: "模糊查询时主动安利",
    description_en: "Proactive suggestions",
  },
  {
    type: "CHOOSE",
    name_zh: "优选优化",
    name_en: "Selection",
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description_zh: "行业榜单与排名卡位",
    description_en: "Industry rankings",
  },
  {
    type: "COMPETE",
    name_zh: "对比优化",
    name_en: "Comparison",
    icon: Scale,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description_zh: "突出核心差异化胜点",
    description_en: "Highlight differentiators",
  },
  {
    type: "TRUST",
    name_zh: "信任优化",
    name_en: "Trust",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    description_zh: "引用资质与权威背书",
    description_en: "Authority citations",
  },
  {
    type: "CONTACT",
    name_zh: "接触优化",
    name_en: "Contact",
    icon: Phone,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    description_zh: "转化路径与试用引导",
    description_en: "Conversion paths",
  },
]


// 原因标签映射
const REASON_LABELS = {
  not_mentioned: { zh: "未被提及", en: "Not Mentioned", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  ranking_low: { zh: "排名靠后", en: "Low Ranking", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  competitor_favored: { zh: "竞品优先", en: "Competitor Favored", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
}

export default function OptimizePage() {
  const { locale } = useI18n()
  const navigate = useNavigate()
  const { currentProject } = useProjectStore()
  const [selectedJourney, setSelectedJourney] = useState<JourneyOptimization | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [optimizations, setOptimizations] = useState<JourneyOptimization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalIssues, setTotalIssues] = useState(0)

  // 从 API 获取优化建议数据
  useEffect(() => {
    const fetchOptimizations = async () => {
      if (!currentProject) return
      setIsLoading(true)
      try {
        const result = await optimizationApi.list(currentProject.id)
        setOptimizations(result.optimizations)
        setTotalIssues(result.total_issues)
      } catch (error) {
        console.error("Failed to fetch optimizations:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchOptimizations()
  }, [currentProject])

  // 将优化数据转换为按 JourneyType 索引的 Map
  const optimizationData = useMemo(() => {
    const map: Record<JourneyType, JourneyOptimization | undefined> = {
      AWARE: undefined,
      RECOMMEND: undefined,
      CHOOSE: undefined,
      COMPETE: undefined,
      TRUST: undefined,
      CONTACT: undefined,
    }
    optimizations.forEach(opt => {
      map[opt.journey] = opt
    })
    return map
  }, [optimizations])

  // 点击卡片打开弹窗
  const handleJourneyClick = (journeyType: JourneyType) => {
    const journeyData = optimizationData[journeyType]
    if (journeyData) {
      setSelectedJourney(journeyData)
      setDialogOpen(true)
    }
  }

  return (
    <>
      <PageHeader
        title={locale === "zh" ? "优化建议" : "Optimization"}
        description={locale === "zh"
          ? "按六大决策旅程分类的优化建议，帮助提升品牌在 AI 平台的可见性"
          : "Optimization suggestions categorized by six decision journeys"
        }
      />

      <div className="p-8 space-y-6">
        {/* 总览卡片 */}
        <AnimatedCard delay={0.05}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {totalIssues}
                    <span className="text-lg font-normal text-muted-foreground ml-1">
                      {locale === "zh" ? "个待优化问题" : " issues to optimize"}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locale === "zh"
                      ? "基于最新模拟结果，按六大旅程分类"
                      : "Based on latest simulation results, categorized by six journeys"
                    }
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate("/workspace")}>
                {locale === "zh" ? "查看详细结果" : "View Details"}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* 六大旅程分类卡片 */}
        {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {JOURNEYS.map((journey, index) => {
            const data = optimizationData[journey.type]
            const issueCount = data?.issue_count ?? 0
            const Icon = journey.icon

            return (
              <AnimatedCard
                key={journey.type}
                delay={0.1 + index * 0.05}
                className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/50"
                onClick={() => handleJourneyClick(journey.type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${journey.bgColor} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${journey.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {locale === "zh" ? journey.name_zh : journey.name_en}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {locale === "zh" ? journey.description_zh : journey.description_en}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={issueCount > 0 ? "secondary" : "outline"}
                      className={issueCount > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : ""}
                    >
                      {issueCount} {locale === "zh" ? "个问题" : "issues"}
                    </Badge>
                  </div>
                </CardHeader>

                {/* 点击查看详情提示 */}
                <CardContent className="pt-0">
                  <div className="flex items-center justify-center text-xs text-muted-foreground">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    {locale === "zh" ? "点击查看详情" : "Click to view details"}
                  </div>
                </CardContent>
              </AnimatedCard>
            )
          })}
        </div>
        )}

        {/* 优化建议说明 */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-semibold">
                {locale === "zh" ? "待优化条件说明" : "Optimization Criteria"}
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-start gap-2">
                  <Badge className={REASON_LABELS.not_mentioned.color}>
                    <Eye className="h-3 w-3 mr-1" />
                    {locale === "zh" ? "未被提及" : "Not Mentioned"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {locale === "zh"
                      ? "AI 回答中完全没有提到品牌"
                      : "Brand not mentioned in AI response"
                    }
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className={REASON_LABELS.ranking_low.color}>
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {locale === "zh" ? "排名靠后" : "Low Ranking"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {locale === "zh"
                      ? "品牌被提及但排名在 Top3 之外"
                      : "Brand mentioned but ranked outside Top 3"
                    }
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className={REASON_LABELS.competitor_favored.color}>
                    <Scale className="h-3 w-3 mr-1" />
                    {locale === "zh" ? "竞品优先" : "Competitor Favored"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {locale === "zh"
                      ? "竞品排名高于品牌"
                      : "Competitor ranked higher than brand"
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 优化详情弹窗 */}
      <OptimizationDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        journey={selectedJourney}
      />
    </>
  )
}
