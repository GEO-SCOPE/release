import { useEffect, useState, useMemo, useCallback } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Filter, MessageSquare, AlertTriangle, Layers } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Loader2 } from "lucide-react"
import type { ResultsPagination } from "@/store/project-store"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"
import { useProjectStore } from "@/store/project-store"
import type { SimulationResult, Run } from "@/lib/api"
import { runApi } from "@/lib/api"
import {
  ENGINES,
  getEngineById,
  ResultCard,
  RunListItem,
  ResultDetailDialog,
} from "@/components/workspace"

export default function WorkspacePage() {
  const { t, locale } = useI18n()
  const { runId } = useParams<{ runId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    currentProject,
    runs,
    benchmarks,
    currentRun,
    currentRunResults,
    resultsPagination,
    loadRuns,
    loadRun,
    loadBenchmarks,
    loadBenchmarkWithQuestions,
    loadMoreResults,
    updateResult,
  } = useProjectStore()

  const [selectedResult, setSelectedResult] = useState<SimulationResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterEngine, setFilterEngine] = useState<string>("all")
  const [filterBenchmark, setFilterBenchmark] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDangerOnly, setFilterDangerOnly] = useState(false)

  // Track if initial data loading is complete
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  // Get questions for current run's benchmark
  const questionsForCurrentRun = useMemo(() => {
    const benchmark = benchmarks.find((b) => b.id === currentRun?.benchmark_id)
    return benchmark?.questions || []
  }, [benchmarks, currentRun?.benchmark_id])

  // Get the selected question for the dialog
  const selectedQuestion = useMemo(() => {
    if (!selectedResult) return null
    return questionsForCurrentRun.find((q) => q.id === selectedResult.question_id) || null
  }, [questionsForCurrentRun, selectedResult])

  // Single unified effect for data loading
  useEffect(() => {
    if (!currentProject) return

    // Load fresh data from API (results are not persisted due to localStorage limits)
    const loadData = async () => {
      await Promise.all([
        loadRuns(currentProject.id),
        loadBenchmarks(currentProject.id),
      ])
      setIsFirstLoad(false)
    }

    loadData()
  }, [currentProject?.id])

  // Handle URL sync and run switching
  useEffect(() => {
    if (!currentProject || isFirstLoad) return

    if (!runId && currentRun) {
      // No runId in URL but we have a default run - update URL silently
      navigate(`/workspace/${currentRun.id}`, { replace: true })
    } else if (runId) {
      // URL has a runId - ensure we have the data
      // Load if: no currentRun, or different run, or missing results
      const needsLoad = !currentRun || currentRun.id !== runId || currentRunResults.length === 0
      if (needsLoad) {
        loadRun(currentProject.id, runId)
      }
    }
  }, [currentProject?.id, runId, currentRun?.id, currentRunResults.length, isFirstLoad])

  // Auto-open result dialog from URL param (from optimization page)
  useEffect(() => {
    const resultId = searchParams.get("resultId")
    if (resultId && currentRunResults.length > 0 && currentProject && currentRun) {
      const result = currentRunResults.find((r) => r.id === resultId)
      if (result) {
        setSelectedResult(result)
        setDialogOpen(true)
        // Clear the search param after opening
        setSearchParams({}, { replace: true })

        // Lazy load benchmark questions if needed
        const benchmark = benchmarks.find((b) => b.id === currentRun.benchmark_id)
        if (benchmark && benchmark.questions.length === 0) {
          loadBenchmarkWithQuestions(currentProject.id, benchmark.id)
        }
      }
    }
  }, [searchParams, currentRunResults, setSearchParams, currentProject, currentRun, benchmarks, loadBenchmarkWithQuestions])

  const handleSelectRun = useCallback((id: string) => {
    navigate(`/workspace/${id}`)
  }, [navigate])

  const handleDeleteRun = useCallback(async (e: React.MouseEvent, runIdToDelete: string) => {
    e.stopPropagation()

    if (!currentProject) return

    if (!confirm(t("workspace.deleteConfirm"))) {
      return
    }

    try {
      await runApi.delete(currentProject.id, runIdToDelete)
      toast.success(t("workspace.deleteSuccess"))
      await loadRuns(currentProject.id)

      // If we deleted the current run, navigate away
      if (runIdToDelete === runId) {
        const remainingRuns = runs.filter(r => r.id !== runIdToDelete && r.status === "completed")
        if (remainingRuns.length > 0) {
          navigate(`/workspace/${remainingRuns[0].id}`)
        } else {
          navigate("/workspace")
        }
      }
    } catch (error) {
      toast.error(t("workspace.deleteFailed"))
      console.error("Delete run failed:", error)
    }
  }, [currentProject, runId, runs, navigate, loadRuns, t])

  const handleViewResult = useCallback(async (result: SimulationResult) => {
    setSelectedResult(result)
    setDialogOpen(true)

    // Lazy load benchmark questions if needed
    if (currentProject && currentRun) {
      const benchmark = benchmarks.find((b) => b.id === currentRun.benchmark_id)
      if (benchmark && benchmark.questions.length === 0) {
        await loadBenchmarkWithQuestions(currentProject.id, benchmark.id)
      }
    }
  }, [currentProject, currentRun, benchmarks, loadBenchmarkWithQuestions])

  // 处理 AI 分析生成后的结果更新
  const handleResultUpdate = useCallback((updatedResult: SimulationResult) => {
    setSelectedResult(updatedResult)  // 更新当前选中的结果
    updateResult(updatedResult)       // 更新 store 中的结果
  }, [updateResult])

  const handleLoadMore = useCallback(() => {
    if (currentProject && runId) {
      loadMoreResults(currentProject.id, runId)
    }
  }, [currentProject, runId, loadMoreResults])

  // Filter runs by benchmark
  const filteredRuns = useMemo(() => {
    let result = runs.filter((r) => r.status === "completed")
    if (filterBenchmark !== "all") {
      result = result.filter((r) => r.benchmark_id === filterBenchmark)
    }
    return result
  }, [runs, filterBenchmark])

  // Group runs by benchmark
  const runsByBenchmark = useMemo(() => {
    const groups: Record<string, Run[]> = {}
    filteredRuns.forEach((run) => {
      const key = run.benchmark_id
      if (!groups[key]) groups[key] = []
      groups[key].push(run)
    })
    return groups
  }, [filteredRuns])

  // Filter results
  const filteredResults = useMemo(() => {
    return currentRunResults.filter((r) => {
      if (filterEngine !== "all" && r.engine !== filterEngine) return false
      if (searchQuery && !r.simulated_response.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filterDangerOnly && !(r.competitor_mentioned && !r.brand_mentioned)) return false
      return true
    })
  }, [currentRunResults, filterEngine, searchQuery, filterDangerOnly])

  // Get benchmark name helper
  const getBenchmarkName = useCallback((benchmarkId: string) => {
    const benchmark = benchmarks.find((b) => b.id === benchmarkId)
    return benchmark?.name || benchmarkId
  }, [benchmarks])

  const completedRuns = useMemo(() => runs.filter((r) => r.status === "completed"), [runs])

  // Check if current data matches the URL - prevents showing stale data
  // Also check if we have results (they're not persisted, so might be empty after refresh)
  const isDataStale = runId && (!currentRun || currentRun.id !== runId || currentRunResults.length === 0)

  // Compute summary metrics from current results
  const summaryMetrics = useMemo(() => {
    if (!currentRun?.summary) return null

    const dangerCount = currentRunResults.filter(r => r.competitor_mentioned && !r.brand_mentioned).length
    const rankedResults = currentRunResults.filter(r => r.brand_mentioned && r.ranking != null)
    const avgRanking = rankedResults.length > 0
      ? rankedResults.reduce((sum, r) => sum + (r.ranking || 0), 0) / rankedResults.length
      : null
    const needsOptimization = currentRunResults.filter(r => !r.brand_mentioned || (r.ranking != null && r.ranking > 3)).length

    return {
      visibilityRate: currentRun.summary.visibility_rate,
      avgRanking,
      dangerCount,
      needsOptimization,
      totalResults: currentRunResults.length,
    }
  }, [currentRun?.summary, currentRunResults])

  // Show full page skeleton during initial load
  if (isFirstLoad) {
    return (
      <>
        <PageHeader
          title={t("workspace.title")}
          description={t("workspace.description")}
        />
        <div className="flex h-[calc(100vh-180px)] pl-8">
          {/* Sidebar Skeleton */}
          <div className="w-72 border-r overflow-hidden">
            <div className="p-4 pl-0 border-b space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="p-4 pl-0 space-y-4">
              <Skeleton className="h-5 w-40 rounded-full" />
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="backdrop-blur-sm bg-card/50">
                  <CardContent className="py-3 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-3">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {/* Content Skeleton */}
          <div className="flex-1 p-6">
            <WorkspaceContentSkeleton />
          </div>
        </div>
      </>
    )
  }

  // After first load, always show content (old content persists during navigation)
  return (
    <>
      <PageHeader
        title={t("workspace.title")}
        description={t("workspace.description")}
      />

      <div className="flex h-[calc(100vh-180px)] pl-8">
        {/* Left Sidebar - Run List */}
        <RunSidebar
          currentProject={currentProject}
          benchmarks={benchmarks}
          completedRuns={completedRuns}
          filteredRuns={filteredRuns}
          runsByBenchmark={runsByBenchmark}
          filterBenchmark={filterBenchmark}
          currentRunId={runId}
          onFilterBenchmarkChange={setFilterBenchmark}
          onSelectRun={handleSelectRun}
          onDeleteRun={handleDeleteRun}
          getBenchmarkName={getBenchmarkName}
          t={t}
          locale={locale}
          navigate={navigate}
        />

        {/* Right Content - Results */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {!currentProject ? (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950" tintOpacity={0} disableBackdrop>
                  <CardContent className="py-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {t("workspace.selectProjectFirst")}
                    </p>
                  </CardContent>
                </Card>
              ) : !currentRun || isDataStale ? (
                // Show skeleton or empty state
                runId ? (
                  // Skeleton loading for run content
                  <WorkspaceContentSkeleton />
                ) : (
                  // No run selected
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {t("workspace.selectRun")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("workspace.selectRunHint")}
                      </p>
                    </CardContent>
                  </Card>
                )
              ) : (
                <>
                  {/* Run Info Header */}
                  <RunInfoHeader
                    currentRun={currentRun}
                    getBenchmarkName={getBenchmarkName}
                  />

                  {/* Results Summary */}
                  {summaryMetrics && (
                    <ResultsSummary metrics={summaryMetrics} t={t} />
                  )}

                  {/* Filters */}
                  <ResultFilters
                    filterEngine={filterEngine}
                    searchQuery={searchQuery}
                    filterDangerOnly={filterDangerOnly}
                    onFilterEngineChange={setFilterEngine}
                    onSearchQueryChange={setSearchQuery}
                    onFilterDangerOnlyChange={setFilterDangerOnly}
                    t={t}
                  />

                  {/* Results List */}
                  <ResultsList
                    results={filteredResults}
                    onViewResult={handleViewResult}
                    filterDangerOnly={filterDangerOnly}
                    onToggleDangerFilter={() => setFilterDangerOnly(!filterDangerOnly)}
                    pagination={resultsPagination}
                    onLoadMore={handleLoadMore}
                    t={t}
                  />
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <ResultDetailDialog
        result={selectedResult}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onResultUpdate={handleResultUpdate}
        question={selectedQuestion}
        t={t}
      />
    </>
  )
}

// --- Sub-components ---

interface RunSidebarProps {
  currentProject: any
  benchmarks: any[]
  completedRuns: Run[]
  filteredRuns: Run[]
  runsByBenchmark: Record<string, Run[]>
  filterBenchmark: string
  currentRunId: string | undefined
  onFilterBenchmarkChange: (value: string) => void
  onSelectRun: (id: string) => void
  onDeleteRun: (e: React.MouseEvent, id: string) => void
  getBenchmarkName: (id: string) => string
  t: (key: string) => string
  locale: string
  navigate: (path: string) => void
}

function RunSidebar({
  currentProject,
  benchmarks,
  completedRuns,
  filteredRuns,
  runsByBenchmark,
  filterBenchmark,
  currentRunId,
  onFilterBenchmarkChange,
  onSelectRun,
  onDeleteRun,
  getBenchmarkName,
  t,
  navigate,
}: RunSidebarProps) {
  return (
    <div className="w-72 border-r overflow-hidden">
      {/* Benchmark Filter */}
      <div className="p-4 pl-0 border-b space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("workspace.benchmarkFilter")}</span>
        </div>
        <Select value={filterBenchmark} onValueChange={onFilterBenchmarkChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("workspace.allBenchmarks")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("workspace.allBenchmarks")}</SelectItem>
            {benchmarks.map((bm) => (
              <SelectItem key={bm.id} value={bm.id}>
                {bm.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Run List */}
      <ScrollArea className="h-[calc(100%-88px)]">
        <div className="p-4 pl-0 space-y-4">
          {!currentProject ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("workspace.selectProject")}
            </p>
          ) : completedRuns.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t("workspace.noRuns")}</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate("/run-center")}
              >
                {t("workspace.goToRunCenter")}
              </Button>
            </div>
          ) : filterBenchmark === "all" ? (
            // Grouped by benchmark
            Object.entries(runsByBenchmark).map(([benchmarkId, groupRuns]) => (
              <div key={benchmarkId}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs border-border dark:border-white/50">
                    {getBenchmarkName(benchmarkId)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {groupRuns.length} {t("workspace.runsCount")}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupRuns.map((run) => (
                    <RunListItem
                      key={run.id}
                      run={run}
                      isSelected={run.id === currentRunId}
                      onClick={() => onSelectRun(run.id)}
                      onDelete={(e) => onDeleteRun(e, run.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Flat list when filtered
            <div className="space-y-2">
              {filteredRuns.map((run) => (
                <RunListItem
                  key={run.id}
                  run={run}
                  isSelected={run.id === currentRunId}
                  onClick={() => onSelectRun(run.id)}
                  onDelete={(e) => onDeleteRun(e, run.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface RunInfoHeaderProps {
  currentRun: Run
  getBenchmarkName: (id: string) => string
}

function RunInfoHeader({ currentRun, getBenchmarkName }: RunInfoHeaderProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">
                {getBenchmarkName(currentRun.benchmark_id)}
              </Badge>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">
                {new Date(currentRun.created_at).toLocaleString()}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {currentRun.engines.map((engine) => {
              const eng = getEngineById(engine)
              return (
                <div
                  key={engine}
                  className="h-6 w-6 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm border"
                >
                  <img src={eng?.icon} alt={eng?.name} className="h-4 w-4 object-contain" />
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ResultsSummaryProps {
  metrics: {
    visibilityRate: number
    avgRanking: number | null
    dangerCount: number
    needsOptimization: number
    totalResults: number
  }
  t: (key: string) => string
}

function ResultsSummary({ metrics, t }: ResultsSummaryProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {(metrics.visibilityRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">{t("workspace.brandExposureRate")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {metrics.avgRanking != null ? `#${metrics.avgRanking.toFixed(1)}` : "-"}
          </p>
          <p className="text-xs text-muted-foreground">{t("workspace.effectiveRanking")}</p>
        </CardContent>
      </Card>
      <Card
        className={metrics.dangerCount > 0 ? "bg-orange-50 dark:bg-orange-950/30 border-orange-300" : ""}
        tintOpacity={metrics.dangerCount > 0 ? 0 : undefined}
        disableBackdrop={metrics.dangerCount > 0}
      >
        <CardContent className="pt-4 text-center">
          <p className={`text-2xl font-bold ${metrics.dangerCount > 0 ? "text-orange-600" : ""}`}>
            {metrics.dangerCount}
            <span className="text-base font-normal text-muted-foreground">/{metrics.totalResults}</span>
          </p>
          <p className="text-xs text-muted-foreground">{t("workspace.dangerCount")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {metrics.needsOptimization}
            <span className="text-base font-normal text-muted-foreground">/{metrics.totalResults}</span>
          </p>
          <p className="text-xs text-muted-foreground">{t("workspace.needOptimization")}</p>
        </CardContent>
      </Card>
    </div>
  )
}

interface ResultFiltersProps {
  filterEngine: string
  searchQuery: string
  filterDangerOnly: boolean
  onFilterEngineChange: (value: string) => void
  onSearchQueryChange: (value: string) => void
  onFilterDangerOnlyChange: (value: boolean) => void
  t: (key: string) => string
}

function ResultFilters({
  filterEngine,
  searchQuery,
  onFilterEngineChange,
  onSearchQueryChange,
  t,
}: ResultFiltersProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("workspace.engine")}:</span>
        <Select value={filterEngine} onValueChange={onFilterEngineChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("workspace.all")}</SelectItem>
            {ENGINES.map((engine) => (
              <SelectItem key={engine.id} value={engine.id}>
                {engine.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("workspace.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
    </div>
  )
}

interface ResultsListProps {
  results: SimulationResult[]
  onViewResult: (result: SimulationResult) => void
  filterDangerOnly: boolean
  onToggleDangerFilter: () => void
  pagination: ResultsPagination
  onLoadMore: () => void
  t: (key: string) => string
}

function ResultsList({
  results,
  onViewResult,
  filterDangerOnly,
  onToggleDangerFilter,
  pagination,
  onLoadMore,
  t,
}: ResultsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t("workspace.simulationResults")} ({results.length}
          {pagination.total > 0 && `/${pagination.total}`})
        </h2>
        <Button
          variant={filterDangerOnly ? "destructive" : "outline"}
          size="sm"
          onClick={onToggleDangerFilter}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          {t("workspace.danger")}
        </Button>
      </div>

      {results.length === 0 ? (
        <Card className="py-8">
          <CardContent className="text-center text-muted-foreground">
            <Filter className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>{t("workspace.noMatchingResults")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 结果列表 */}
          <div className="space-y-4">
            {results.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                onClick={() => onViewResult(result)}
                t={t}
              />
            ))}
          </div>

          {/* 加载更多按钮 */}
          {pagination.hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={pagination.isLoadingMore}
                className="gap-2"
              >
                {pagination.isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("workspace.loading")}
                  </>
                ) : (
                  t("workspace.loadMore")
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Skeleton loading component for workspace content
// Uses blur effect and theme-aware colors for smooth visual transition
function WorkspaceContentSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Run Info Header Skeleton */}
      <Card className="backdrop-blur-sm bg-card/60 border-primary/10">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32 rounded-full bg-primary/10" />
              <Skeleton className="h-4 w-4 rounded-full bg-muted-foreground/20" />
              <Skeleton className="h-4 w-36 bg-muted-foreground/20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full bg-primary/10" />
              <Skeleton className="h-6 w-6 rounded-full bg-primary/10" />
              <Skeleton className="h-6 w-6 rounded-full bg-primary/10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {[
          "bg-green-500/10",
          "bg-blue-500/10",
          "bg-orange-500/10",
          "bg-amber-500/10"
        ].map((color, i) => (
          <Card key={i} className="backdrop-blur-sm bg-card/60 border-primary/10">
            <CardContent className="pt-4 text-center space-y-2">
              <Skeleton className={`h-8 w-20 mx-auto ${color}`} />
              <Skeleton className="h-3 w-24 mx-auto bg-muted-foreground/20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex items-center gap-4 py-2">
        <Skeleton className="h-9 w-[140px] bg-muted-foreground/10" />
        <Skeleton className="h-9 flex-1 bg-muted-foreground/10" />
      </div>

      {/* Results Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48 bg-muted-foreground/20" />
        <Skeleton className="h-9 w-24 bg-primary/10 rounded-md" />
      </div>

      {/* Result Cards Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="backdrop-blur-sm bg-card/60 border-primary/10 overflow-hidden">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0 bg-primary/10" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full bg-primary/20" />
                    <Skeleton className="h-5 w-16 rounded-full bg-muted-foreground/20" />
                    <Skeleton className="h-5 w-20 rounded-full bg-muted-foreground/20" />
                  </div>
                  <Skeleton className="h-4 w-full bg-muted-foreground/10" />
                  <Skeleton className="h-4 w-3/4 bg-muted-foreground/10" />
                  <Skeleton className="h-4 w-1/2 bg-muted-foreground/10" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
