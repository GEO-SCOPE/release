/**
 * Settings Plan - 订阅计划
 * 现代卡片式布局，与项目整体风格一致
 */

import { useEffect, useState } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Zap, Calendar, BarChart3, Loader2, Play, CheckCircle2, XCircle, Clock, Rocket, Star, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedCard } from "@/components/magic/animated-card"
import { runApi } from "@/lib/api"
import type { Run } from "@/api/types"
import { useProjectStore } from "@/store/project-store"
import { useI18n } from "@/lib/i18n"

// 套餐完整数据
const plansData = [
  {
    id: "starter",
    name: "Starter",
    subtitle: "入门版",
    price: "$99",
    priceSuffix: "/月 (年付)",
    icon: Rocket,
    features: [
      { label: "提示词数量", value: "50 个" },
      { label: "监控频率", value: "8 次模拟/日" },
      { label: "每月调用量", value: "12,000 次" },
      { label: "支持平台", value: "仅 ChatGPT" },
      { label: "优化文章", value: "无" },
      { label: "Prompt 来源", value: "品牌手动输入" },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    subtitle: "增长版",
    price: "$399",
    priceSuffix: "/月",
    icon: Star,
    popular: true,
    features: [
      { label: "提示词数量", value: "100 个" },
      { label: "监控频率", value: "8 次模拟/日" },
      { label: "每月调用量", value: "24,000 次" },
      { label: "支持平台", value: "ChatGPT, Perplexity, Google AIO" },
      { label: "优化文章", value: "6 篇/月" },
      { label: "Prompt 来源", value: "品牌输入 + Prompt Volumes" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "企业版",
    price: "Custom",
    priceSuffix: "",
    icon: Crown,
    features: [
      { label: "提示词数量", value: "定制配额" },
      { label: "监控频率", value: "高频轮询 (每 15 分钟)" },
      { label: "每月调用量", value: "不设上限" },
      { label: "支持平台", value: "10 全平台" },
      { label: "优化文章", value: "无限/定制" },
      { label: "Prompt 来源", value: "全量数据 + 竞品分析" },
    ],
  },
]

// Mock 当前用户数据
const currentPlan = {
  id: "growth",
  expiresAt: "2025-03-22",
  usage: {
    runs: { used: 8560, total: 24000 },
    prompts: { used: 67, total: 100 },
  },
}

// 用量记录类型
interface UsageRecord {
  id: string
  date: string
  type: string
  engines: string[]
  apiCalls: number
  successCalls: number
  failedCalls: number
  status: string
}

export default function SettingsPlan() {
  const { t } = useI18n()
  const activePlanData = plansData.find(p => p.id === currentPlan.id)
  const { currentProject } = useProjectStore()
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalUsage, setTotalUsage] = useState({ apiCalls: 0, successCalls: 0 })

  // 从运行记录中加载用量数据
  useEffect(() => {
    const loadUsageRecords = async () => {
      if (!currentProject) return

      setIsLoading(true)
      try {
        const { runs } = await runApi.list(currentProject.id)

        // 转换运行记录为用量记录
        const records: UsageRecord[] = runs.map((run: Run) => ({
          id: run.id,
          date: run.created_at ? new Date(run.created_at).toLocaleDateString("zh-CN") : "-",
          type: "模拟运行",
          engines: run.engines || [],
          apiCalls: run.progress?.total || 0,
          successCalls: run.progress?.completed || 0,
          failedCalls: run.progress?.failed || 0,
          status: run.status || "unknown",
        }))

        setUsageRecords(records)

        // 计算总用量
        const total = records.reduce((acc, r) => ({
          apiCalls: acc.apiCalls + r.apiCalls,
          successCalls: acc.successCalls + r.successCalls,
        }), { apiCalls: 0, successCalls: 0 })
        setTotalUsage(total)
      } catch (error) {
        console.error("Failed to load usage records:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUsageRecords()
  }, [currentProject])

  const handleUpgrade = () => {
    toast.info(t("settings.plan.contactSales"))
  }

  // 获取状态徽章样式
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">{t("settings.plan.status.completed")}</Badge>
      case "running":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">{t("settings.plan.status.running")}</Badge>
      case "failed":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">{t("settings.plan.status.failed")}</Badge>
      default:
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-200">{t("settings.plan.status.pending")}</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* 当前套餐 & 用量统计 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 当前套餐 */}
        <AnimatedCard delay={0.05} className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {t("settings.plan.currentPlan")}
                </CardTitle>
                <CardDescription>{t("settings.plan.currentPlanDesc")}</CardDescription>
              </div>
              <Badge className="text-sm px-3 py-1 bg-primary/20 text-primary border-primary/30">
                {activePlanData?.name} ({activePlanData?.subtitle})
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{t("settings.plan.expiresAt")}: {currentPlan.expiresAt}</span>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* 用量统计 */}
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              {t("settings.plan.usage")}
            </CardTitle>
            <CardDescription>{t("settings.plan.usageDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("settings.plan.apiCalls")}</span>
                <span className="text-muted-foreground">
                  {totalUsage.apiCalls.toLocaleString()} / {currentPlan.usage.runs.total.toLocaleString()}
                </span>
              </div>
              <Progress
                value={Math.min((totalUsage.apiCalls / currentPlan.usage.runs.total) * 100, 100)}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("settings.plan.runTasks")}</span>
                <span className="text-muted-foreground">
                  {usageRecords.length} {t("settings.plan.times")}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("settings.plan.successRate")}</span>
                <span className="text-muted-foreground">
                  {totalUsage.apiCalls > 0
                    ? ((totalUsage.successCalls / totalUsage.apiCalls) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <Progress
                value={totalUsage.apiCalls > 0 ? (totalUsage.successCalls / totalUsage.apiCalls) * 100 : 0}
                className="h-2"
              />
            </div>
          </CardContent>
        </AnimatedCard>
      </div>

      {/* 用量记录 */}
      <AnimatedCard delay={0.15}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            {t("settings.plan.usageRecords")}
          </CardTitle>
          <CardDescription>{t("settings.plan.usageRecordsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t("settings.plan.loading")}</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">{t("settings.plan.date")}</TableHead>
                    <TableHead className="w-[100px]">{t("settings.plan.type")}</TableHead>
                    <TableHead>{t("settings.plan.engines")}</TableHead>
                    <TableHead className="w-[180px]">{t("settings.plan.callStats")}</TableHead>
                    <TableHead className="w-[100px] text-right">{t("settings.plan.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Play className="h-10 w-10 text-muted-foreground/30" />
                          <span className="text-muted-foreground">{t("settings.plan.noRecords")}</span>
                          <span className="text-xs text-muted-foreground/60">{t("settings.plan.noRecordsHint")}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    usageRecords.slice(0, 10).map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {record.date}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 text-primary" />
                            <span className="text-sm">{t("settings.plan.simulationRun")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {record.engines.map((engine) => (
                              <Badge key={engine} variant="outline" className="text-xs font-normal">
                                {engine}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {record.successCalls}
                            </span>
                            {record.failedCalls > 0 && (
                              <span className="flex items-center gap-1 text-red-500">
                                <XCircle className="h-3.5 w-3.5" />
                                {record.failedCalls}
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              / {record.apiCalls}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {usageRecords.length > 10 && (
                <div className="text-center pt-4 text-sm text-muted-foreground border-t mt-4">
                  {t("settings.plan.showingRecords").replace("{count}", "10").replace("{total}", String(usageRecords.length))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </AnimatedCard>

      {/* ============== 报价总览 - 暂时注释 ==============
      <div>
        <h2 className="text-xl font-semibold mb-2">报价总览</h2>
        <p className="text-sm text-muted-foreground">选择适合您业务规模的套餐方案</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 pt-4">
        {plansData.map((plan, index) => {
          const Icon = plan.icon
          const isCurrent = currentPlan.id === plan.id
          const isEnterprise = plan.id === "enterprise"

          return (
            <div key={plan.id} className="relative pt-3">
              {(isCurrent || plan.popular) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  <Badge
                    className={cn(
                      "px-3 shadow-lg",
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-amber-500 text-white"
                    )}
                  >
                    {isCurrent ? "当前方案" : "热门"}
                  </Badge>
                </div>
              )}

              <AnimatedCard
                delay={0.15 + index * 0.05}
                className={cn(
                  isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  isEnterprise && "bg-gradient-to-b from-amber-500/10 to-transparent"
                )}
              >
              <CardHeader className="text-center pb-2 pt-6">
                <div className={cn(
                  "mx-auto mb-3 h-12 w-12 rounded-xl flex items-center justify-center",
                  isEnterprise ? "bg-amber-500/20" : "bg-primary/10"
                )}>
                  <Icon className={cn(
                    "h-6 w-6",
                    isEnterprise ? "text-amber-500" : "text-primary"
                  )} />
                </div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.subtitle}</CardDescription>
                <div className="mt-4">
                  <span className={cn(
                    "text-3xl font-bold",
                    isEnterprise && "text-amber-500"
                  )}>
                    {plan.price}
                  </span>
                  {plan.priceSuffix && (
                    <span className="text-sm text-muted-foreground">{plan.priceSuffix}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        isEnterprise ? "text-amber-500" : "text-primary"
                      )} />
                      <span>
                        <span className="text-muted-foreground">{feature.label}:</span>{" "}
                        <span className="font-medium">{feature.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-4 border-t">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      当前方案
                    </Button>
                  ) : isEnterprise ? (
                    <Button
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={handleUpgrade}
                    >
                      联系销售
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={handleUpgrade}>
                      {currentPlan.id === "enterprise" ? "降级" : "升级"}到 {plan.name}
                    </Button>
                  )}
                </div>
              </CardContent>
              </AnimatedCard>
            </div>
          )
        })}
      </div>
      ============== 报价总览 - 注释结束 ============== */}
    </div>
  )
}
