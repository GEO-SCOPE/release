/**
 * GEO-SCOPE Dashboard/Home Page
 * Target Customer: e签宝 (电子合约 B2B)
 */

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlayIcon, TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon, BarChart3Icon } from "@/components/icons"
import { MultiLineChart } from "@/components/simple-charts"
import { useI18n } from "@/lib/i18n"
import { PageHeader } from "@/components/page-header"
import { AnimatedCard } from "@/components/magic/animated-card"
import { AISummary } from "@/components/ai-summary"
import { useProjectStore } from "@/store/project-store"
import { dashboardApi } from "@/lib/api"
import type { DashboardData, AIEngine } from "@/api/types"

export default function DashboardPage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const { currentProject, metrics, runs, loadProjects, loadProject, loadMetrics, loadRuns } = useProjectStore()
  const [selectedEngine, setSelectedEngine] = useState<AIEngine | "all">("all")
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [, setLoading] = useState(true)


  // Load project data on mount
  useEffect(() => {
    loadProjects().then(() => {
      // Load default project if no current project
      if (!currentProject) {
        loadProject("default-esign")
      }
    })
  }, [])

  // Load metrics and dashboard data when project or selectedEngine changes
  useEffect(() => {
    if (currentProject) {
      loadMetrics(currentProject.id, selectedEngine)
      loadRuns(currentProject.id)
      // Load dashboard data from API with engine filter
      setLoading(true)
      dashboardApi.getData(currentProject.id, selectedEngine)
        .then(data => {
          setDashboardData(data)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [currentProject, selectedEngine])

  // Get AI summary based on locale
  const aiSummary = dashboardData?.aiSummary
    ? (locale === "zh" ? dashboardData.aiSummary.zh : dashboardData.aiSummary.en)
    : ""

  return (
    <>
      <PageHeader
        title={t("nav.dashboard")}
        description={currentProject ? `${currentProject.brand_name} - ${currentProject.industry}` : t("visibility.description")}
      >
        <Select value={selectedEngine} onValueChange={(value) => setSelectedEngine(value as AIEngine | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Engines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{locale === "zh" ? "全部引擎" : "All Engines"}</SelectItem>
            <SelectItem value="chatgpt">ChatGPT</SelectItem>
            <SelectItem value="deepseek">DeepSeek</SelectItem>
            <SelectItem value="claude">Claude</SelectItem>
            <SelectItem value="doubao">{locale === "zh" ? "豆包" : "Doubao"}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => navigate("/run-center")} className="gap-2">
          <PlayIcon className="h-4 w-4" />
          {locale === "zh" ? "启动模拟" : "Start Simulation"}
        </Button>
      </PageHeader>

      <div className="p-8 space-y-6">
        {/* Key Metrics Cards (P0) */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* 品牌曝光率 */}
          <AnimatedCard delay={0.05}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUpIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {metrics && metrics.total_simulations > 0
                        ? `${(metrics.visibility_rate * 100).toFixed(1)}%`
                        : "--"}
                    </p>
                    {/* 趋势指示器：曝光率越高越好，所以 trend 为正数时表示进步 */}
                    {metrics?.visibility_rate_trend != null && metrics.visibility_rate_trend !== 0 && (
                      <span className={`flex items-center text-xs font-medium ${
                        metrics.visibility_rate_trend > 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {metrics.visibility_rate_trend > 0 ? (
                          <TrendingUpIcon className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDownIcon className="h-3 w-3 mr-0.5" />
                        )}
                        {Math.abs(metrics.visibility_rate_trend * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{locale === "zh" ? "品牌曝光率" : "Visibility Rate"}</p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>

          {/* 待优化查询数 (X/N) */}
          <AnimatedCard delay={0.1}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {metrics && metrics.total_simulations > 0
                      ? (
                        <>
                          {metrics.needs_optimization_count}
                          <span className="text-base font-normal text-muted-foreground">/{metrics.total_questions}</span>
                        </>
                      )
                      : "--"}
                  </p>
                  <p className="text-xs text-muted-foreground">{locale === "zh" ? "待优化查询数" : "Needs Optimization"}</p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>

          {/* 平均有效排名 */}
          <AnimatedCard delay={0.15}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <BarChart3Icon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {metrics && metrics.total_simulations > 0 && metrics.avg_ranking != null && metrics.avg_ranking > 0
                        ? `#${metrics.avg_ranking.toFixed(1)}`
                        : "--"}
                    </p>
                    {/* 趋势指示器：排名数字越小越好，所以 trend 为负数时表示进步 */}
                    {metrics?.avg_ranking_trend != null && metrics.avg_ranking_trend !== 0 && (
                      <span className={`flex items-center text-xs font-medium ${
                        metrics.avg_ranking_trend < 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {metrics.avg_ranking_trend < 0 ? (
                          <TrendingUpIcon className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDownIcon className="h-3 w-3 mr-0.5" />
                        )}
                        {Math.abs(metrics.avg_ranking_trend).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{locale === "zh" ? "平均有效排名" : "Avg Effective Ranking"}</p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        </div>

        {/* AI Summary Section */}
        <AISummary summary={aiSummary} />

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Industry Rankings */}
          <AnimatedCard delay={0.1}>
            <CardHeader>
              <CardTitle className="text-base">{t("visibility.industryRanking")}</CardTitle>
              <CardDescription>{locale === "zh" ? "电子合约行业品牌可见性" : "E-Contract Industry Visibility"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics && metrics.total_simulations > 0 && dashboardData?.industryRankings && dashboardData.industryRankings.length > 0 ? (
                dashboardData.industryRankings.map((item, index) => (
                  <motion.div
                    key={item.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                    className={`flex items-center gap-3 rounded-lg p-4 transition-colors ${
                      item.isHighlighted ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        item.isHighlighted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      }`}
                    >
                      {item.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {item.brand}
                        {item.isHighlighted && (
                          <Badge variant="secondary" className="text-xs">
                            {locale === "zh" ? "当前品牌" : "Current"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-lg font-semibold">{item.visibility.toFixed(2)}%</div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <BarChart3Icon className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">
                    {locale === "zh" ? "暂无排名数据" : "No ranking data"}
                  </p>
                  <p className="text-xs mt-1">
                    {locale === "zh" ? "请在运行中心启动 AI 可见性测试" : "Please start AI visibility tests in Run Center"}
                  </p>
                </div>
              )}
            </CardContent>
          </AnimatedCard>

          {/* Visibility Trend Chart */}
          <AnimatedCard delay={0.2}>
            <CardHeader className="pb-6">
              <CardTitle className="text-base">{t("visibility.trendChart")}</CardTitle>
              <CardDescription>{locale === "zh" ? "近7日各品牌可见性趋势" : "7-Day Brand Visibility Trend"}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {dashboardData?.visibilityTrends && dashboardData.visibilityTrends.length > 0 ? (
                <MultiLineChart
                  data={dashboardData.visibilityTrends}
                  lines={dashboardData.brandLines || []}
                  height={400}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground" style={{ height: 400 }}>
                  <TrendingUpIcon className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-sm">
                    {locale === "zh" ? "暂无趋势数据" : "No trend data"}
                  </p>
                  <p className="text-xs mt-1">
                    {locale === "zh" ? "请在运行中心启动 AI 可见性测试" : "Please start AI visibility tests in Run Center"}
                  </p>
                </div>
              )}
            </CardContent>
          </AnimatedCard>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <AnimatedCard delay={0.25} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/run-center")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <PlayIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{locale === "zh" ? "启动新模拟" : "Start New Simulation"}</h3>
                <p className="text-sm text-muted-foreground">{locale === "zh" ? "配置并运行 AI 可见性测试" : "Configure and run AI visibility tests"}</p>
              </div>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.3} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/workspace")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BarChart3Icon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">{locale === "zh" ? "查看结果" : "View Results"}</h3>
                <p className="text-sm text-muted-foreground">{locale === "zh" ? "分析模拟结果和引用来源" : "Analyze simulation results & citations"}</p>
              </div>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.35} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/optimize")}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUpIcon className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">{locale === "zh" ? "优化建议" : "Optimization"}</h3>
                <p className="text-sm text-muted-foreground">{locale === "zh" ? "获取提升品牌可见性的建议" : "Get suggestions to improve visibility"}</p>
              </div>
            </CardContent>
          </AnimatedCard>
        </div>
      </div>
    </>
  )
}
