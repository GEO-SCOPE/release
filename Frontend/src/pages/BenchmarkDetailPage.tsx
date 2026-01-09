import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft, MoreHorizontal, Edit2, Trash2, Play,
  CheckCircle2, FileText, Users, Clock,
  RefreshCw, Plus, Search, History, GitBranch
} from "lucide-react"
import { JourneyStageCard, INTENT_STAGES, EditQuestionDialog, AddQuestionDialog, VersionHistoryDialog } from "@/components/benchmarks"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"
import { useProjectStore } from "@/store/project-store"
import type { Question, IntentType } from "@/api/types"
import { benchmarkApi, questionApi } from "@/lib/api"

export default function BenchmarkDetailPage() {
  const { id: benchmarkId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { locale } = useI18n()

  const {
    currentProject,
    benchmarks,
    loadBenchmarks,
    loadBenchmarkWithQuestions,
    loadPersonas,
    updateBenchmarkStatus,
  } = useProjectStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPersonaName, setSelectedPersonaName] = useState<string | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)

  // Question edit dialog state
  const [editQuestionDialogOpen, setEditQuestionDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  // Add question dialog state
  const [addQuestionDialogOpen, setAddQuestionDialogOpen] = useState(false)

  // Version history dialog state
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)

  // Load benchmarks list if not loaded
  useEffect(() => {
    if (currentProject && benchmarks.length === 0) {
      loadBenchmarks(currentProject.id)
    }
  }, [currentProject, benchmarks.length, loadBenchmarks])

  // Load full benchmark with questions when viewing detail page
  useEffect(() => {
    if (currentProject && benchmarkId) {
      const existingBenchmark = benchmarks.find(b => b.id === benchmarkId)
      // Load questions if not already loaded
      if (!existingBenchmark?.questions || existingBenchmark.questions.length === 0) {
        setIsLoadingQuestions(true)
        loadBenchmarkWithQuestions(currentProject.id, benchmarkId).finally(() => {
          setIsLoadingQuestions(false)
        })
      }
      // Always load personas for avatar display
      loadPersonas(currentProject.id)
    }
  }, [currentProject, benchmarkId, benchmarks, loadBenchmarkWithQuestions, loadPersonas])

  // Find current benchmark
  const benchmark = useMemo(() => {
    return benchmarks.find(b => b.id === benchmarkId)
  }, [benchmarks, benchmarkId])

  // Extract unique persona names from questions
  const availablePersonaNames = useMemo(() => {
    if (!benchmark?.questions) return []
    const names = new Set<string>()
    benchmark.questions.forEach(q => {
      if (q.persona_name) {
        names.add(q.persona_name)
      }
    })
    return Array.from(names).sort()
  }, [benchmark?.questions])

  // Filter and group questions
  const { questionsByIntent, totalQuestions } = useMemo(() => {
    if (!benchmark?.questions) {
      return {
        questionsByIntent: {} as Record<IntentType, Question[]>,
        totalQuestions: 0
      }
    }

    // Apply filters
    let filtered = benchmark.questions.filter(q => {
      if (selectedPersonaName !== "all" && q.persona_name !== selectedPersonaName) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!q.text.toLowerCase().includes(query) && !q.keyword?.toLowerCase().includes(query)) {
          return false
        }
      }
      return true
    })

    // Group by intent
    const grouped = filtered.reduce((acc, q) => {
      if (!acc[q.intent]) acc[q.intent] = []
      acc[q.intent].push(q)
      return acc
    }, {} as Record<IntentType, Question[]>)

    return { questionsByIntent: grouped, totalQuestions: benchmark.questions.length }
  }, [benchmark?.questions, selectedPersonaName, searchQuery])

  // Handlers
  const handleBack = () => navigate("/benchmarks")

  const handleStartEditing = () => {
    setEditedName(benchmark?.name || "")
    setIsEditing(true)
  }

  const handleSaveName = () => {
    if (editedName.trim()) {
      // TODO: Call API to update benchmark name
      toast.success(locale === "zh" ? "名称已更新" : "Name updated")
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!currentProject || !benchmark) return

    try {
      await benchmarkApi.delete(currentProject.id, benchmark.id)
      toast.success(locale === "zh" ? "Benchmark 已删除" : "Benchmark deleted")
      setDeleteDialogOpen(false)
      // Reload benchmarks to update the list
      await loadBenchmarks(currentProject.id)
      navigate("/benchmarks")
    } catch {
      toast.error(locale === "zh" ? "删除失败" : "Delete failed")
    }
  }

  const handleToggleActive = async () => {
    if (!currentProject || !benchmark) return
    const newIsActive = !benchmark.is_active
    try {
      await updateBenchmarkStatus(currentProject.id, benchmark.id, newIsActive ? "ready" : "draft")
      toast.success(
        locale === "zh"
          ? `已${newIsActive ? "激活" : "取消激活"}`
          : `Benchmark ${newIsActive ? "activated" : "deactivated"}`
      )
    } catch {
      toast.error(locale === "zh" ? "操作失败" : "Operation failed")
    }
  }

  const handleRunSimulation = () => {
    navigate(`/run-center?benchmarkId=${benchmark?.id}`)
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setEditQuestionDialogOpen(true)
  }

  const handleEditQuestionSuccess = async () => {
    if (currentProject) {
      await loadBenchmarks(currentProject.id)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!currentProject) return

    if (!confirm(locale === "zh" ? "确定要删除这个问题吗？" : "Are you sure you want to delete this question?")) {
      return
    }

    try {
      await questionApi.delete(currentProject.id, questionId)
      toast.success(locale === "zh" ? "问题已删除" : "Question deleted")
      // Reload benchmarks to update the questions
      await loadBenchmarks(currentProject.id)
    } catch {
      toast.error(locale === "zh" ? "删除失败" : "Delete failed")
    }
  }

  // Skeleton loading component for questions
  const QuestionsSkeletonLoading = () => (
    <>
      {/* Header Skeleton */}
      <div className="px-8 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-10 w-10 rounded-md bg-primary/10" />
          <Skeleton className="h-8 w-64 bg-primary/10" />
          <Skeleton className="h-6 w-16 rounded-full bg-primary/10" />
        </div>
        <Skeleton className="h-4 w-96 ml-12 bg-muted/50" />
      </div>

      <div className="p-8 space-y-6">
        {/* Meta Card Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="h-5 w-32 bg-muted/50" />
                <Skeleton className="h-5 w-40 bg-muted/50" />
                <Skeleton className="h-5 w-24 bg-muted/50" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-32 bg-primary/10" />
                <Skeleton className="h-10 w-10 rounded-md bg-muted/50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64 bg-muted/50" />
            <Skeleton className="h-10 w-48 bg-muted/50" />
          </div>
          <Skeleton className="h-9 w-28 bg-primary/10" />
        </div>

        {/* Journey Stage Skeletons */}
        <div className="grid gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg bg-primary/20" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24 bg-primary/10" />
                      <Skeleton className="h-3 w-40 bg-muted/50" />
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                      <Skeleton className="h-8 w-8 rounded-full bg-primary/10" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full bg-muted/50" />
                        <Skeleton className="h-3 w-20 bg-muted/30" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )

  // Loading state
  if (!benchmark) {
    return <QuestionsSkeletonLoading />
  }

  // Questions loading state
  if (isLoadingQuestions && (!benchmark.questions || benchmark.questions.length === 0)) {
    return <QuestionsSkeletonLoading />
  }

  const status = benchmark.status || "ready"
  const date = new Date(benchmark.created_at)

  return (
    <>
      {/* Header with Back Button */}
      <div className="px-8 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {isEditing ? (
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className="max-w-sm"
              autoFocus
            />
          ) : (
            <h1 className="text-2xl font-bold">{benchmark.name}</h1>
          )}
          <Badge
            variant="outline"
            className={
              status === "ready"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : status === "running"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
            }
          >
            {status === "ready" ? (locale === "zh" ? "就绪" : "Ready")
              : status === "draft" ? (locale === "zh" ? "草稿" : "Draft")
              : status === "generating" ? (locale === "zh" ? "生成中" : "Generating")
              : status === "running" ? (locale === "zh" ? "运行中" : "Running")
              : (locale === "zh" ? "已归档" : "Archived")
            }
          </Badge>

          {/* Version Badge */}
          {benchmark.current_version && (
            <Badge
              variant="outline"
              className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-indigo-500/20"
              onClick={() => setVersionHistoryOpen(true)}
            >
              <GitBranch className="h-3 w-3 mr-1" />
              v{benchmark.current_version}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground pl-12">{benchmark.scenario}</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Benchmark Meta Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {availablePersonaNames.length > 0
                    ? availablePersonaNames.join(", ")
                    : (locale === "zh" ? "未指定" : "Not specified")
                  }
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {totalQuestions} {locale === "zh" ? "个问题" : "questions"}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRunSimulation}
                  disabled={status !== "ready"}
                  title={status !== "ready" ? (locale === "zh" ? "只有就绪状态才能运行" : "Only ready benchmarks can run") : ""}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {locale === "zh" ? "运行模拟" : "Run Simulation"}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 backdrop-blur-xl bg-background/80 border-white/20"
                  >
                    <DropdownMenuItem onClick={handleStartEditing} className="py-2.5">
                      <Edit2 className="mr-3 h-4 w-4 text-muted-foreground" />
                      {locale === "zh" ? "重命名" : "Rename"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleActive} className="py-2.5">
                      <CheckCircle2 className="mr-3 h-4 w-4 text-muted-foreground" />
                      {benchmark.is_active
                        ? (locale === "zh" ? "取消激活" : "Deactivate")
                        : (locale === "zh" ? "激活" : "Activate")
                      }
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVersionHistoryOpen(true)} className="py-2.5">
                      <History className="mr-3 h-4 w-4 text-muted-foreground" />
                      {locale === "zh" ? "版本历史" : "Version History"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="py-2.5 text-destructive focus:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-3 h-4 w-4" />
                      {locale === "zh" ? "删除" : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={locale === "zh" ? "搜索问题..." : "Search questions..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Persona Filter - dynamically shows personas present in questions */}
            <div className="flex items-center gap-1 border rounded-md p-1 flex-wrap">
              <Button
                variant={selectedPersonaName === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedPersonaName("all")}
                className="h-7 text-xs"
              >
                {locale === "zh" ? "全部" : "All"}
              </Button>
              {availablePersonaNames.map(name => (
                <Button
                  key={name}
                  variant={selectedPersonaName === name ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPersonaName(name)}
                  className="h-7 text-xs"
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Add Question Button */}
          <Button variant="outline" size="sm" onClick={() => setAddQuestionDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {locale === "zh" ? "添加问题" : "Add Question"}
          </Button>
        </div>

        {/* Journey Stages */}
        <div className="grid gap-6">
          {(Object.keys(INTENT_STAGES) as IntentType[]).map((intent) => (
            <JourneyStageCard
              key={intent}
              intent={intent}
              questions={questionsByIntent[intent] || []}
              locale={locale}
              showEdit={true}
              showDelete={true}
              onEdit={handleEditQuestion}
              onDelete={handleDeleteQuestion}
            />
          ))}
        </div>

      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === "zh" ? "确认删除" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === "zh"
                ? `确定要删除 "${benchmark.name}" 吗？此操作不可撤销。`
                : `Are you sure you want to delete "${benchmark.name}"? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {locale === "zh" ? "取消" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {locale === "zh" ? "删除" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Question Dialog */}
      <EditQuestionDialog
        open={editQuestionDialogOpen}
        onOpenChange={setEditQuestionDialogOpen}
        question={editingQuestion}
        projectId={currentProject?.id || ""}
        onSuccess={handleEditQuestionSuccess}
      />

      {/* Add Question Dialog */}
      <AddQuestionDialog
        open={addQuestionDialogOpen}
        onOpenChange={setAddQuestionDialogOpen}
        projectId={currentProject?.id || ""}
        benchmarkId={benchmark?.id || ""}
        onSuccess={handleEditQuestionSuccess}
      />

      {/* Version History Dialog */}
      <VersionHistoryDialog
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        projectId={currentProject?.id || ""}
        benchmarkId={benchmark?.id || ""}
        currentVersion={benchmark?.current_version}
        onRestore={handleEditQuestionSuccess}
      />
    </>
  )
}
