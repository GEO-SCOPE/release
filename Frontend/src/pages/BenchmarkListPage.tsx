import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus, Search, FileText,
  LayoutGrid, List, Download,
  Play, Loader2
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { BenchmarkCard } from "@/components/benchmarks"
import { CardMasonry } from "@/components/reactbits/Masonry"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"
import { useProjectStore } from "@/store/project-store"
import type { Benchmark, BenchmarkStatus } from "@/api/types"
import { CreateBenchmarkDialog } from "@/components/benchmarks/CreateBenchmarkDialog"

type ViewMode = "grid" | "list"

export default function BenchmarkListPage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate()

  const {
    currentProject,
    benchmarks,
    loadBenchmarks,
  } = useProjectStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<BenchmarkStatus | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [runningBenchmarkId, setRunningBenchmarkId] = useState<string | null>(null)

  // Load benchmarks when project changes (only if not already loaded)
  useEffect(() => {
    if (currentProject && benchmarks.length === 0) {
      loadBenchmarks(currentProject.id)
    }
  }, [currentProject, benchmarks.length, loadBenchmarks])

  // Filter benchmarks
  const filteredBenchmarks = benchmarks.filter(b => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = b.name.toLowerCase().includes(query)
      const matchesScenario = b.scenario.toLowerCase().includes(query)
      if (!matchesName && !matchesScenario) return false
    }
    // Status filter
    if (statusFilter !== "all") {
      const benchmarkStatus = b.status || "ready"
      if (benchmarkStatus !== statusFilter) return false
    }
    return true
  })

  // Stats
  const totalBenchmarks = benchmarks.length
  const readyBenchmarks = benchmarks.filter(b => (b.status || "ready") === "ready").length
  const draftBenchmarks = benchmarks.filter(b => b.status === "draft" || b.status === "generating").length
  const totalQuestions = benchmarks.reduce((sum, b) => sum + (b.questions?.length || b.total_questions || 0), 0)

  const handleBenchmarkClick = (benchmark: Benchmark) => {
    navigate(`/benchmarks/${benchmark.id}`)
  }

  const handleCreateSuccess = (newBenchmark: Benchmark) => {
    setCreateDialogOpen(false)
    toast.success(t("benchmarks.createSuccess"))
    // Navigate to detail page
    navigate(`/benchmarks/${newBenchmark.id}`)
  }

  const handleRunBenchmark = async (benchmark: Benchmark) => {
    setRunningBenchmarkId(benchmark.id)
    toast.info(t("benchmarks.runningMessage").replace("{name}", benchmark.name))

    // TODO: 实际调用运行 API
    // Simulate running for now
    setTimeout(() => {
      setRunningBenchmarkId(null)
      toast.success(t("benchmarks.runComplete"))
    }, 3000)
  }

  return (
    <>
      <PageHeader
        title={t("benchmarks.title")}
        description={t("benchmarks.description")}
      />

      <div className="p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalBenchmarks}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("benchmarks.totalBenchmarks")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{readyBenchmarks}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("benchmarks.ready")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{draftBenchmarks}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("benchmarks.draft")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("benchmarks.totalQuestions")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Search & Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("benchmarks.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={statusFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-7 text-xs"
              >
                {t("benchmarks.all")}
              </Button>
              <Button
                variant={statusFilter === "ready" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("ready")}
                className="h-7 text-xs"
              >
                {t("benchmarks.ready")}
              </Button>
              <Button
                variant={statusFilter === "draft" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("draft")}
                className="h-7 text-xs"
              >
                {t("benchmarks.draft")}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-7 w-7"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="h-7 w-7"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t("benchmarks.export")}
            </Button>

            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("benchmarks.createBenchmark")}
            </Button>
          </div>
        </div>

        {/* Benchmark Grid/List */}
        {filteredBenchmarks.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || statusFilter !== "all"
                  ? t("benchmarks.noResults")
                  : t("benchmarks.noBenchmarks")
                }
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? t("benchmarks.tryAdjust")
                  : t("benchmarks.createFirst")
                }
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("benchmarks.createBenchmark")}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <CardMasonry columns={{ default: 1, md: 2, lg: 3 }} gap={16}>
            {filteredBenchmarks.map((benchmark) => (
              <BenchmarkCard
                key={benchmark.id}
                benchmark={benchmark}
                locale={locale}
                isRunning={runningBenchmarkId === benchmark.id}
                onClick={handleBenchmarkClick}
                onRun={handleRunBenchmark}
              />
            ))}
          </CardMasonry>
        ) : (
          <div className="space-y-2">
            {filteredBenchmarks.map((benchmark) => (
              <Card
                key={benchmark.id}
                className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/20"
                onClick={() => handleBenchmarkClick(benchmark)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{benchmark.name}</p>
                        <p className="text-sm text-muted-foreground">{benchmark.scenario}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {benchmark.questions?.length || benchmark.total_questions || 0} {t("benchmarks.questionsShort")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          (benchmark.status || "ready") === "ready"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {(benchmark.status || "ready") === "ready"
                          ? t("benchmarks.ready")
                          : t("benchmarks.draft")
                        }
                      </Badge>
                      {(benchmark.status || "ready") === "ready" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${runningBenchmarkId === benchmark.id ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                          disabled={runningBenchmarkId === benchmark.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRunBenchmark(benchmark)
                          }}
                        >
                          {runningBenchmarkId === benchmark.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Benchmark Dialog */}
      <CreateBenchmarkDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
}
