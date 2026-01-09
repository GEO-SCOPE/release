import { useEffect, useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Play, RotateCcw, Clock, CheckCircle2, XCircle,
  Zap, Settings2, History, MessageSquare, Trash2, RefreshCw, CalendarClock
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"
import { useProjectStore, type ActiveRunProgress, type RunProgressLog } from "@/store/project-store"
import { runApi, scheduledTaskApi } from "@/lib/api"
import type { AIEngine, Benchmark, Run, RunStatus } from "@/lib/api"
import { ScheduledTaskDialog } from "@/components/ScheduledTaskDialog"

// Engine configurations
const ENGINES: { id: AIEngine; name: string; icon: string; color: string }[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "/platforms/ChatGPT-Logo.png", color: "bg-green-500" },
  { id: "deepseek", name: "DeepSeek", icon: "/platforms/deepseek.png", color: "bg-blue-500" },
  { id: "claude", name: "Claude", icon: "/platforms/claude.png", color: "bg-orange-500" },
  { id: "doubao", name: "豆包", icon: "/platforms/doubao.png", color: "bg-purple-500" },
]


// Status badge component
function StatusBadge({ status, t }: { status: RunStatus; t: (key: string) => string }) {
  const statusConfig = {
    pending: { labelKey: "runCenter.statusPending", variant: "secondary" as const, icon: Clock },
    running: { labelKey: "runCenter.statusRunning", variant: "solid-info" as const, icon: RotateCcw },
    completed: { labelKey: "runCenter.statusCompleted", variant: "solid-success" as const, icon: CheckCircle2 },
    failed: { labelKey: "runCenter.statusFailed", variant: "solid-destructive" as const, icon: XCircle },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${status === "running" ? "animate-spin" : ""}`} />
      {t(config.labelKey)}
    </Badge>
  )
}

// Run Configuration Panel
function RunConfigPanel({
  selectedEngines,
  setSelectedEngines,
  selectedBenchmark,
  setSelectedBenchmark,
  benchmarks,
  onStartRun,
  isLoading,
  t,
}: {
  selectedEngines: AIEngine[]
  setSelectedEngines: (engines: AIEngine[]) => void
  selectedBenchmark: string
  setSelectedBenchmark: (id: string) => void
  benchmarks: Benchmark[]
  onStartRun: () => void
  isLoading: boolean
  t: (key: string) => string
}) {
  const toggleEngine = (id: AIEngine) => {
    if (selectedEngines.includes(id)) {
      setSelectedEngines(selectedEngines.filter((e) => e !== id))
    } else {
      setSelectedEngines([...selectedEngines, id])
    }
  }

  const selectedBm = benchmarks.find((b) => b.id === selectedBenchmark)
  const totalQuestions = selectedBm?.total_questions || 0
  const totalTasks = totalQuestions * selectedEngines.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          {t("runCenter.runConfig")}
        </CardTitle>
        <CardDescription>{t("runCenter.runConfigDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benchmark Selection */}
        <div className="space-y-2">
          <Label>{t("runCenter.testSuite")}</Label>
          <Select value={selectedBenchmark} onValueChange={setSelectedBenchmark}>
            <SelectTrigger>
              <SelectValue placeholder={t("runCenter.selectTestSuite")} />
            </SelectTrigger>
            <SelectContent>
              {benchmarks.map((bm) => (
                <SelectItem
                  key={bm.id}
                  value={bm.id}
                  disabled={bm.status === "running" || bm.status === "generating"}
                >
                  <div className="flex items-center gap-2 max-w-[280px]">
                    <span className="truncate flex-1">{bm.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${
                        bm.status === "running" ? "bg-amber-500/10 text-amber-600" :
                        bm.status === "generating" ? "bg-blue-500/10 text-blue-600" :
                        ""
                      }`}
                    >
                      {bm.status === "running" ? t("runCenter.statusRunning") :
                       bm.status === "generating" ? t("runCenter.generating") :
                       `${bm.total_questions} ${t("runCenter.questions")}`}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Engine Selection */}
        <div className="space-y-3">
          <Label>{t("runCenter.aiEngines")}</Label>
          <div className="grid grid-cols-2 gap-3">
            {ENGINES.map((engine) => (
              <div
                key={engine.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedEngines.includes(engine.id)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
                  }`}
                onClick={() => toggleEngine(engine.id)}
              >
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm border shrink-0">
                  <img src={engine.icon} alt={engine.name} className="h-6 w-6 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{engine.name}</p>
                </div>
                <Checkbox checked={selectedEngines.includes(engine.id)} className="shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("runCenter.totalTasks")}</span>
              <span className="font-semibold">{totalTasks}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">{t("runCenter.estimatedTime")}</span>
              <span className="font-semibold">~{Math.ceil(totalTasks * 5 / 60)} {t("runCenter.minutes")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={onStartRun}
          disabled={isLoading || selectedEngines.length === 0 || !selectedBenchmark || selectedBm?.status === "running"}
        >
          {isLoading ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
              {t("runCenter.runningBtn")}
            </>
          ) : selectedBm?.status === "running" ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
              {t("runCenter.statusRunning")}
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              {t("runCenter.startSimulation")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Run History Panel
function RunHistoryPanel({
  runs,
  onViewRun,
  onRetryRun,
  onDeleteRun,
  t,
}: {
  runs: Run[]
  onViewRun: (run: Run) => void
  onRetryRun: (run: Run) => void
  onDeleteRun: (run: Run) => void
  t: (key: string) => string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {t("runCenter.runHistory")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>{t("runCenter.noRunRecords")}</p>
            <p className="text-sm">{t("runCenter.startFirstRun")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.slice(0, 5).map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => onViewRun(run)}
                >
                  <StatusBadge status={run.status} t={t} />
                  <div>
                    <p className="font-medium text-sm">
                      {run.engines.map((e) => ENGINES.find((en) => en.id === e)?.name).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(run.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <p className="font-semibold">{run.progress.completed}/{run.progress.total}</p>
                    <Progress
                      value={(run.progress.completed / run.progress.total) * 100}
                      className="w-20 h-1 mt-1"
                    />
                  </div>
                  {(run.status === "failed" || run.status === "completed") && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRetryRun(run)
                        }}
                        title={t("runCenter.rerun")}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteRun(run)
                        }}
                        title={t("runCenter.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Streaming Run Monitor - shows real-time progress during SSE streaming
function StreamingRunMonitor({
  progress,
  t,
}: {
  progress: ActiveRunProgress
  t: (key: string) => string
}) {
  const progressPercent = progress.totalCalls > 0
    ? (progress.completedCalls / progress.totalCalls) * 100
    : 0

  const statusLabels: Record<string, string> = {
    created: t("runCenter.statusCreated"),
    running: t("runCenter.statusRunning"),
    evaluating: t("runCenter.statusEvaluating"),
    completed: t("runCenter.statusCompleted"),
    failed: t("runCenter.statusFailed"),
  }

  return (
    <Card className="border-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
            {t("runCenter.liveMonitor")}
          </CardTitle>
          <Badge variant={
            progress.status === "completed" ? "solid-success" :
            progress.status === "failed" ? "solid-destructive" :
            progress.status === "evaluating" ? "solid-warning" :
            "solid-info"
          }>
            {progress.status === "running" && <RotateCcw className="h-3 w-3 mr-1 animate-spin" />}
            {statusLabels[progress.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>{t("runCenter.question")} {progress.currentQuestion} / {progress.totalQuestions}</span>
            <span>{progress.completedCalls} / {progress.totalCalls} {t("runCenter.calls")} ({progressPercent.toFixed(1)}%)</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Current Question */}
        {progress.currentQuestionText && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm line-clamp-2">{progress.currentQuestionText}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="mx-auto h-5 w-5 text-green-500 mb-1" />
            <p className="text-lg font-semibold text-green-600">{progress.completedCalls}</p>
            <p className="text-xs text-muted-foreground">{t("runCenter.success")}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
            <RotateCcw className="mx-auto h-5 w-5 text-blue-500 mb-1 animate-spin" />
            <p className="text-lg font-semibold text-blue-600">
              {progress.totalCalls - progress.completedCalls - progress.failedCalls}
            </p>
            <p className="text-xs text-muted-foreground">{t("runCenter.inProgress")}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
            <XCircle className="mx-auto h-5 w-5 text-red-500 mb-1" />
            <p className="text-lg font-semibold text-red-600">{progress.failedCalls}</p>
            <p className="text-xs text-muted-foreground">{t("runCenter.failed")}</p>
          </div>
        </div>

        {/* Real-time Logs */}
        <div>
          <p className="text-sm font-medium mb-2">{t("runCenter.liveLogs")}</p>
          <ScrollArea className="h-32 rounded-lg border bg-muted/30 p-2">
            <div className="space-y-1 font-mono text-xs">
              {progress.logs.slice(-20).map((log, idx) => (
                <div key={idx} className={`flex gap-2 ${
                  log.type === "error" ? "text-red-500" :
                  log.type === "success" ? "text-green-500" :
                  "text-muted-foreground"
                }`}>
                  <span className="text-muted-foreground">[{log.time}]</span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

// Current Run Monitor - shows completed run info
function CurrentRunMonitor({
  run,
  t,
}: {
  run: Run | null
  t: (key: string) => string
}) {
  if (!run) return null

  const progress = (run.progress.completed / run.progress.total) * 100

  return (
    <Card className="border-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {t("runCenter.currentRun")}
          </CardTitle>
          <StatusBadge status={run.status} t={t} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>{t("runCenter.progress")}</span>
            <span>{run.progress.completed} / {run.progress.total} ({progress.toFixed(1)}%)</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="mx-auto h-5 w-5 text-green-500 mb-1" />
            <p className="text-lg font-semibold text-green-600">{run.progress.completed}</p>
            <p className="text-xs text-muted-foreground">{t("runCenter.completed")}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
            <RotateCcw className="mx-auto h-5 w-5 text-blue-500 mb-1 animate-spin" />
            <p className="text-lg font-semibold text-blue-600">
              {run.progress.total - run.progress.completed - run.progress.failed}
            </p>
            <p className="text-xs text-muted-foreground">{t("runCenter.inProgress")}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
            <XCircle className="mx-auto h-5 w-5 text-red-500 mb-1" />
            <p className="text-lg font-semibold text-red-600">{run.progress.failed}</p>
            <p className="text-xs text-muted-foreground">{t("runCenter.failed")}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {run.engines.map((engine) => {
            const config = ENGINES.find((e) => e.id === engine)
            return (
              <Badge key={engine} variant="outline" className="text-xs">
                {config?.name}
              </Badge>
            )
          })}
        </div>

        {run.status === "completed" && run.summary && (
          <Card className="bg-muted/50">
            <CardContent className="py-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("runCenter.exposureRate")}</span>
                  <p className="font-semibold text-lg">{(run.summary.visibility_rate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("runCenter.avgRanking")}</span>
                  <p className="font-semibold text-lg">#{run.summary.avg_ranking.toFixed(1)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("runCenter.top3Rate")}</span>
                  <p className="font-semibold text-lg">{(run.summary.top3_rate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("runCenter.highRisk")}</span>
                  <p className="font-semibold text-lg text-red-500">{run.summary.high_risk_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

export default function RunCenterPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const {
    currentProject,
    benchmarks,
    activeBenchmark,
    runs,
    currentRun,
    loadBenchmarks,
    loadRuns,
    updateBenchmarkStatus,
    runProgress,
    isRunStreaming: isStreaming,
    setRunStreaming,
    setRunProgressState,
    updateRunProgressState,
    appendRunProgressLogs,
  } = useProjectStore()

  const [selectedEngines, setSelectedEngines] = useState<AIEngine[]>(["chatgpt", "deepseek", "claude", "doubao"])
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>("")
  const [scheduledTaskDialogOpen, setScheduledTaskDialogOpen] = useState(false)
  const [scheduledTasksCount, setScheduledTasksCount] = useState(0)

  // Load scheduled tasks count from API
  const loadScheduledTasksCount = useCallback(async () => {
    if (!currentProject) return
    try {
      const { tasks } = await scheduledTaskApi.list(currentProject.id)
      const enabledCount = tasks.filter((t) => t.enabled).length
      setScheduledTasksCount(enabledCount)
    } catch (error) {
      console.error("Failed to load scheduled tasks count:", error)
    }
  }, [currentProject])

  useEffect(() => {
    if (currentProject) {
      loadBenchmarks(currentProject.id)
      loadRuns(currentProject.id)
      loadScheduledTasksCount()
    }
  }, [currentProject, loadBenchmarks, loadRuns, loadScheduledTasksCount])

  // Refresh scheduled tasks count when dialog closes
  useEffect(() => {
    if (!scheduledTaskDialogOpen && currentProject) {
      loadScheduledTasksCount()
    }
  }, [scheduledTaskDialogOpen, currentProject, loadScheduledTasksCount])

  useEffect(() => {
    if (activeBenchmark) {
      setSelectedBenchmark(activeBenchmark.id)
    }
  }, [activeBenchmark])

  // Resume polling for running tasks after page refresh
  const pollingRef = useRef<boolean>(false)
  const pollingRunIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!currentProject || isStreaming) return

    const runningRun = runs.find(r => r.status === "running" || (r.status as string) === "evaluating")
    if (!runningRun) return

    // Prevent multiple polling instances for the same run
    if (pollingRef.current && pollingRunIdRef.current === runningRun.id) return

    pollingRef.current = true
    pollingRunIdRef.current = runningRun.id

    console.log("[RunCenter] Found running task, resuming polling:", runningRun.id)
    setRunStreaming(true)
    setRunProgressState({
      runId: runningRun.id,
      benchmarkId: runningRun.benchmark_id,
      status: runningRun.status as ActiveRunProgress["status"],
      totalQuestions: Math.ceil(runningRun.progress.total / runningRun.engines.length),
      totalCalls: runningRun.progress.total,
      currentQuestion: Math.ceil(runningRun.progress.completed / runningRun.engines.length),
      completedCalls: runningRun.progress.completed,
      failedCalls: runningRun.progress.failed,
      currentQuestionText: "",
      logs: [{ time: new Date().toLocaleTimeString("zh-CN", { hour12: false }), message: t("runCenter.resumingPolling"), type: "info" }],
    })

    // Resume polling
    let cancelled = false
    const pollProgress = async () => {
      if (!currentProject || cancelled) return

      try {
        const progress = await runApi.getProgress(currentProject.id, runningRun.id)

        if (cancelled) return

        // Only refresh runs list every other poll to reduce requests
        await loadRuns(currentProject.id)

        updateRunProgressState({
          status: progress.status as ActiveRunProgress["status"],
          totalQuestions: progress.total_questions,
          totalCalls: progress.total_calls,
          currentQuestion: progress.completed_questions,
          completedCalls: progress.completed_calls,
          failedCalls: progress.failed_calls,
          currentQuestionText: `${t("runCenter.question")} ${progress.completed_questions}/${progress.total_questions}`,
        })

        if (progress.status === "completed") {
          toast.success(t("runCenter.simulationComplete"))
          setRunStreaming(false)
          pollingRef.current = false
          pollingRunIdRef.current = null
          setTimeout(() => navigate(`/workspace/${runningRun.id}`), 2000)
          return
        }

        if (progress.status === "failed") {
          toast.error(`${t("runCenter.runFailed")}: ${progress.error || t("runCenter.serverRestart")}`)
          setRunStreaming(false)
          pollingRef.current = false
          pollingRunIdRef.current = null
          return
        }

        if (!cancelled) {
          setTimeout(pollProgress, 3000)
        }
      } catch (error) {
        console.error("Polling error:", error)
        if (!cancelled) {
          setTimeout(pollProgress, 5000)
        }
      }
    }

    pollProgress()

    return () => {
      cancelled = true
    }
  }, [runs, currentProject, isStreaming, loadRuns, navigate, setRunStreaming, setRunProgressState, updateRunProgressState])

  const handleStartRun = async () => {
    if (!currentProject) {
      toast.error(t("runCenter.selectProjectFirst"))
      return
    }

    if (!selectedBenchmark) {
      toast.error(t("runCenter.selectBenchmarkFirst"))
      return
    }

    setRunStreaming(true)

    // Initialize progress state (don't update benchmark status yet - backend will do it)
    setRunProgressState({
      runId: "",
      benchmarkId: selectedBenchmark,
      status: "created",
      totalQuestions: 0,
      totalCalls: 0,
      currentQuestion: 0,
      completedCalls: 0,
      failedCalls: 0,
      currentQuestionText: "",
      logs: [{ time: new Date().toLocaleTimeString("zh-CN", { hour12: false }), message: t("runCenter.statusRunning"), type: "info" }],
    })

    try {
      // 1. Start background task
      console.log("Starting run with:", { benchmark_id: selectedBenchmark, providers: selectedEngines })
      const { run_id } = await runApi.start(currentProject.id, {
        benchmark_id: selectedBenchmark,
        providers: selectedEngines,
      })

      updateRunProgressState({
        runId: run_id,
        status: "running",
      })
      appendRunProgressLogs([
        {
          time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
          message: `${t("runCenter.taskStarted")}: ${run_id}`,
          type: "success",
        },
      ])

      // 2. Poll for progress
      let lastCompletedCalls = 0
      const pollProgress = async () => {
        try {
          const progress = await runApi.getProgress(currentProject.id, run_id)

          // Refresh runs list to update stats (Today's Runs, Success Rate, Active Now)
          await loadRuns(currentProject.id)

          // Add log entry when progress changes
          const newLogs: RunProgressLog[] = []
          if (progress.completed_calls > lastCompletedCalls) {
            const diff = progress.completed_calls - lastCompletedCalls
            newLogs.push({
              time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
              message: `✓ ${t("runCenter.completedCalls").replace("{count}", String(diff))} (${progress.completed_calls}/${progress.total_calls})`,
              type: "success" as const,
            })
            lastCompletedCalls = progress.completed_calls
          }

          // Log stage changes
          if (progress.current_stage === "evaluating") {
            newLogs.push({
              time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
              message: t("runCenter.analyzingResults"),
              type: "info" as const,
            })
          }

          updateRunProgressState({
            status: progress.status as ActiveRunProgress["status"],
            totalQuestions: progress.total_questions,
            totalCalls: progress.total_calls,
            currentQuestion: progress.completed_questions,
            completedCalls: progress.completed_calls,
            failedCalls: progress.failed_calls,
            currentQuestionText: `${t("runCenter.question")} ${progress.completed_questions}/${progress.total_questions}`,
          })
          if (newLogs.length > 0) {
            appendRunProgressLogs(newLogs)
          }

          // Check if completed
          if (progress.status === "completed") {
            updateRunProgressState({ status: "completed" })
            appendRunProgressLogs([
              { time: new Date().toLocaleTimeString("zh-CN", { hour12: false }), message: t("runCenter.runComplete"), type: "success" },
            ])
            toast.success(t("runCenter.simulationComplete"))

            // Update benchmark status back to "ready"
            await updateBenchmarkStatus(currentProject.id, selectedBenchmark, "ready")

            setRunStreaming(false)

            // Navigate to results after a short delay
            setTimeout(() => {
              navigate(`/workspace/${run_id}`)
            }, 2000)
            return
          }

          if (progress.status === "failed") {
            updateRunProgressState({ status: "failed" })
            appendRunProgressLogs([
              { time: new Date().toLocaleTimeString("zh-CN", { hour12: false }), message: `${t("runCenter.failed")}: ${progress.error}`, type: "error" },
            ])
            toast.error(`${t("runCenter.runFailed")}: ${progress.error}`)

            // Update benchmark status back to "ready"
            await updateBenchmarkStatus(currentProject.id, selectedBenchmark, "ready")
            setRunStreaming(false)
            return
          }

          // Continue polling (every 3 seconds)
          setTimeout(pollProgress, 3000)
        } catch (error) {
          console.error("Polling error:", error)
          // Continue polling even on error
          setTimeout(pollProgress, 5000)
        }
      }

      // Start polling
      pollProgress()

    } catch (error: unknown) {
      let errorMsg = t("runCenter.unknownError")
      if (error && typeof error === 'object' && 'message' in error) {
        errorMsg = String((error as { message: string }).message)
      }
      if (error && typeof error === 'object' && 'detail' in error) {
        errorMsg = String((error as { detail: string }).detail)
      }
      console.error("Run start failed:", error, "benchmark_id:", selectedBenchmark)
      toast.error(`${t("runCenter.startFailed")}: ${errorMsg}`)

      setRunStreaming(false)
      setRunProgressState(null)
    }
  }

  const handleViewRun = (run: Run) => {
    navigate(`/workspace/${run.id}`)
  }

  const handleRetryRun = async (run: Run) => {
    // Start a new run with the same configuration
    if (!selectedBenchmark) {
      toast.error(t("runCenter.selectBenchmarkFirst"))
      return
    }
    // Use the same engines from the previous run
    setSelectedEngines(run.engines as AIEngine[])
    // Trigger a new run
    toast.info(t("runCenter.retryWithSameConfig"))
    // Call handleStartRun logic
    handleStartRun()
  }

  const handleDeleteRun = async (run: Run) => {
    if (!currentProject) {
      toast.error(t("runCenter.selectProjectFirst"))
      return
    }
    if (!confirm(t("runCenter.deleteConfirm"))) {
      return
    }
    try {
      await runApi.delete(currentProject.id, run.id)
      toast.success(t("runCenter.deleteSuccess"))
      // Refresh runs list
      await loadRuns(currentProject.id)
    } catch (error) {
      toast.error(t("runCenter.deleteFailed"))
      console.error("Delete run failed:", error)
    }
  }

  // Daily Stats Calculation
  const today = new Date().toDateString()
  const todaysRuns = runs.filter(r => new Date(r.created_at).toDateString() === today)
  const totalRunsToday = todaysRuns.length
  const completedToday = todaysRuns.filter(r => r.status === "completed").length
  const successRateToday = totalRunsToday > 0 ? (completedToday / totalRunsToday) * 100 : 0
  const activeRunsCount = runs.filter(r => r.status === "running").length

  return (
    <>
      <PageHeader
        title={t("runCenter.title")}
        description={t("runCenter.description")}
      />

      <div className="flex h-[calc(100vh-180px)]">
        {!currentProject ? (
          <div className="flex-1 p-8">
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950" disableBackdrop>
              <CardContent className="py-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t("runCenter.selectProjectFirst")}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Main Content - Left */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-8 space-y-6">
              {/* Streaming Run Monitor - shows during SSE streaming */}
              {isStreaming && runProgress && (
                <StreamingRunMonitor progress={runProgress} t={t} />
              )}

              {/* Current Run Monitor - shows for non-streaming runs */}
              {!isStreaming && currentRun && currentRun.status === "running" && (
                <CurrentRunMonitor run={currentRun} t={t} />
              )}

              {/* Quick Stats */}
              {/* Quick Stats - Daily Report */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <History className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{totalRunsToday}</p>
                        <p className="text-xs text-muted-foreground">{t("runCenter.todaysRuns")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setScheduledTaskDialogOpen(true)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'color-mix(in oklch, var(--secondary-accent, var(--primary)) 15%, transparent)' }}
                      >
                        <CalendarClock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{scheduledTasksCount}</p>
                        <p className="text-xs text-muted-foreground">{t("runCenter.scheduledTasks")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <RotateCcw className={`h-5 w-5 text-blue-500 ${activeRunsCount > 0 ? "animate-spin" : ""}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{activeRunsCount}</p>
                        <p className="text-xs text-muted-foreground">{t("runCenter.activeNow")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Run History */}
              <RunHistoryPanel runs={runs} onViewRun={handleViewRun} onRetryRun={handleRetryRun} onDeleteRun={handleDeleteRun} t={t} />
                </div>
              </ScrollArea>
            </div>

            {/* Sidebar - Configuration - Right */}
            <div className="w-[440px] border-l overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-8 space-y-6">
                  <RunConfigPanel
                    selectedEngines={selectedEngines}
                    setSelectedEngines={setSelectedEngines}
                    selectedBenchmark={selectedBenchmark}
                    setSelectedBenchmark={setSelectedBenchmark}
                    benchmarks={benchmarks}
                    onStartRun={handleStartRun}
                    isLoading={isStreaming}
                    t={t}
                  />
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>

      {/* Scheduled Task Dialog */}
      <ScheduledTaskDialog
        open={scheduledTaskDialogOpen}
        onOpenChange={setScheduledTaskDialogOpen}
        benchmarks={benchmarks}
        projectId={currentProject?.id || ""}
      />
    </>
  )
}
