import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
  History,
  GitBranch,
  FileText,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"
import { benchmarkApi } from "@/lib/api"
import type { BenchmarkVersion, BenchmarkVersionDetail } from "@/api/types"

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  benchmarkId: string
  currentVersion?: string
  onRestore?: () => void
}

// Change type config - icons and colors only
const CHANGE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  initial: {
    icon: <GitBranch className="h-4 w-4" />,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  question_added: {
    icon: <Plus className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  question_modified: {
    icon: <Edit3 className="h-4 w-4" />,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  question_deleted: {
    icon: <Trash2 className="h-4 w-4" />,
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  benchmark_updated: {
    icon: <Edit3 className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  restored: {
    icon: <RotateCcw className="h-4 w-4" />,
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
  projectId,
  benchmarkId,
  currentVersion,
  onRestore,
}: VersionHistoryDialogProps) {
  const { t, locale } = useI18n()
  const [versions, setVersions] = useState<BenchmarkVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [versionDetails, setVersionDetails] = useState<Record<string, BenchmarkVersionDetail>>({})
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [versionToRestore, setVersionToRestore] = useState<BenchmarkVersion | null>(null)
  const [restoring, setRestoring] = useState(false)

  // Load versions when dialog opens
  useEffect(() => {
    if (open && projectId && benchmarkId) {
      loadVersions()
    }
  }, [open, projectId, benchmarkId])

  // Find the best version to undo to:
  // 1. First priority: most recent non-current version with runs
  // 2. Fallback: first non-current version
  const undoTargetVersion = useMemo(() => {
    if (versions.length < 2) return null

    // Find non-current versions with runs (sorted by version number descending)
    const versionsWithRuns = versions
      .filter(v => !v.is_current && v.run_count > 0)
      .sort((a, b) => {
        const [aMajor, aMinor] = a.version.split('.').map(Number)
        const [bMajor, bMinor] = b.version.split('.').map(Number)
        return bMajor - aMajor || bMinor - aMinor
      })

    if (versionsWithRuns.length > 0) {
      return versionsWithRuns[0]
    }

    // Fallback: first non-current version (sorted by version number descending)
    const nonCurrentVersions = versions
      .filter(v => !v.is_current)
      .sort((a, b) => {
        const [aMajor, aMinor] = a.version.split('.').map(Number)
        const [bMajor, bMinor] = b.version.split('.').map(Number)
        return bMajor - aMajor || bMinor - aMinor
      })

    return nonCurrentVersions[0] || null
  }, [versions])

  const loadVersions = async () => {
    setLoading(true)
    try {
      const response = await benchmarkApi.listVersions(projectId, benchmarkId)
      setVersions(response.versions || [])
    } catch (error) {
      console.error("Failed to load versions:", error)
      toast.error(t("benchmarks.version.loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const loadVersionDetail = async (versionId: string) => {
    if (versionDetails[versionId]) return // Already loaded

    try {
      const detail = await benchmarkApi.getVersion(projectId, benchmarkId, versionId)
      setVersionDetails(prev => ({ ...prev, [versionId]: detail }))
    } catch (error) {
      console.error("Failed to load version detail:", error)
    }
  }

  const handleAccordionChange = (value: string) => {
    setExpandedVersion(value)
    if (value) {
      loadVersionDetail(value)
    }
  }

  const handleRestoreClick = (version: BenchmarkVersion) => {
    setVersionToRestore(version)
    setRestoreDialogOpen(true)
  }

  const handleRestoreConfirm = async () => {
    if (!versionToRestore) return

    setRestoring(true)
    try {
      await benchmarkApi.restoreVersion(projectId, benchmarkId, versionToRestore.id)
      toast.success(t("benchmarks.version.restoredTo", { version: versionToRestore.version }))
      setRestoreDialogOpen(false)
      onOpenChange(false)
      onRestore?.()
    } catch (error) {
      console.error("Failed to restore version:", error)
      toast.error(t("benchmarks.version.restoreFailed"))
    } finally {
      setRestoring(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl h-[85vh] max-h-[85vh] flex flex-col !overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("benchmarks.version.title")}
              {currentVersion && (
                <Badge variant="outline" className="ml-2">
                  {t("benchmarks.version.current")}: v{currentVersion}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Quick Undo Button - show when there's a valid undo target */}
          {!loading && undoTargetVersion && (
            <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg flex-shrink-0">
              <div className="text-sm text-muted-foreground">
                {t("benchmarks.version.restoreTo", { version: undoTargetVersion.version })}
                {undoTargetVersion.run_count > 0 && (
                  <span className="ml-2 text-xs">
                    ({undoTargetVersion.run_count} {t("benchmarks.version.runs")})
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestoreClick(undoTargetVersion)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("benchmarks.version.undoChanges")}
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 flex-1">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex-1">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("benchmarks.version.noHistory")}</p>
              <p className="text-sm mt-2">
                {t("benchmarks.version.noHistoryHint")}
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-full pr-4">
              <Accordion
                type="single"
                collapsible
                value={expandedVersion || undefined}
                onValueChange={handleAccordionChange}
              >
                {versions.map((version) => {
                  const changeType = version.change_type || "initial"
                  const typeConfig = CHANGE_TYPE_CONFIG[changeType] || CHANGE_TYPE_CONFIG.initial
                  const detail = versionDetails[version.id]

                  return (
                    <AccordionItem key={version.id} value={version.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            {/* Version badge */}
                            <Badge
                              variant={version.is_current ? "default" : "outline"}
                              className="font-mono"
                            >
                              v{version.version}
                            </Badge>

                            {/* Change type */}
                            <Badge variant="outline" className={typeConfig.color}>
                              {typeConfig.icon}
                              <span className="ml-1">
                                {t(`benchmarks.version.type.${changeType}` as any)}
                              </span>
                            </Badge>

                            {/* Current indicator */}
                            {version.is_current && (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {t("benchmarks.version.current")}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {/* Run count */}
                            {version.run_count > 0 && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {version.run_count} {t("benchmarks.version.runs")}
                              </span>
                            )}
                            {/* Date */}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(version.created_at)}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="pl-4 pt-2 space-y-4">
                          {/* Change summary */}
                          {version.change_summary && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">
                                {t("benchmarks.version.changeSummary")}
                              </span>
                              {version.change_summary}
                            </div>
                          )}

                          {/* Snapshot details */}
                          {detail?.snapshot && (
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                              <div className="text-sm">
                                <span className="font-medium">
                                  {t("benchmarks.version.questionsCount")}
                                </span>
                                {detail.snapshot.questions?.length || 0}
                              </div>

                              {detail.snapshot.benchmark && (
                                <div className="text-sm">
                                  <span className="font-medium">
                                    {t("benchmarks.version.scenario")}
                                  </span>
                                  {detail.snapshot.benchmark.scenario}
                                </div>
                              )}

                              {/* Question preview */}
                              {detail.snapshot.questions && detail.snapshot.questions.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">
                                    {t("benchmarks.version.questionPreview")}
                                  </div>
                                  <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                                    {detail.snapshot.questions.slice(0, 5).map((q, i) => (
                                      <div key={q.id || i} className="truncate">
                                        {i + 1}. {q.text}
                                      </div>
                                    ))}
                                    {detail.snapshot.questions.length > 5 && (
                                      <div className="text-muted-foreground/70">
                                        {t("benchmarks.version.andMore")} {detail.snapshot.questions.length - 5} {t("benchmarks.version.more")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Restore button (only for non-current versions) */}
                          {!version.is_current && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreClick(version)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              {t("benchmarks.version.restoreToVersion")}
                            </Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("benchmarks.version.confirmRestore")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("benchmarks.version.confirmRestoreDesc", { version: versionToRestore?.version })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm} disabled={restoring}>
              {restoring ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t("benchmarks.version.restoring")}
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t("benchmarks.version.confirmRestoreBtn")}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
