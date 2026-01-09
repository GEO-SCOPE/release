import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Calendar,
  Clock,
  Play,
  Trash2,
  Plus,
  CalendarClock,
  Loader2,
  Pencil,
  Save,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { scheduledTaskApi, type ScheduledTask } from "@/lib/api"
import type { AIEngine, Benchmark } from "@/lib/api"

// Engine configurations (same as RunCenterPage)
const ENGINES: { id: AIEngine; name: string; icon: string }[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "/platforms/ChatGPT-Logo.png" },
  { id: "deepseek", name: "DeepSeek", icon: "/platforms/deepseek.png" },
  { id: "claude", name: "Claude", icon: "/platforms/claude.png" },
  { id: "doubao", name: "Doubao", icon: "/platforms/doubao.png" },
]

interface ScheduledTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  benchmarks: Benchmark[]
  projectId: string
}

export function ScheduledTaskDialog({
  open,
  onOpenChange,
  benchmarks,
  projectId,
}: ScheduledTaskDialogProps) {
  const { t } = useI18n()

  // Form state for creating new task
  const [taskName, setTaskName] = useState("")
  const [selectedBenchmark, setSelectedBenchmark] = useState("")
  const [selectedEngines, setSelectedEngines] = useState<AIEngine[]>(["chatgpt", "deepseek", "claude", "doubao"])
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily")
  const [dayOfWeek, setDayOfWeek] = useState(1) // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [hour, setHour] = useState("09")
  const [minute, setMinute] = useState("00")

  // Combine hour and minute into time string
  const time = `${hour}:${minute}`

  // Scheduled tasks list
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    try {
      const { tasks } = await scheduledTaskApi.list(projectId)
      setTasks(tasks)
    } catch (error) {
      console.error("Failed to load scheduled tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  // Load tasks when dialog opens
  useEffect(() => {
    if (open) {
      loadTasks()
    }
  }, [open, loadTasks])

  const toggleEngine = (id: AIEngine) => {
    if (selectedEngines.includes(id)) {
      setSelectedEngines(selectedEngines.filter((e) => e !== id))
    } else {
      setSelectedEngines([...selectedEngines, id])
    }
  }

  const resetForm = () => {
    setTaskName("")
    setSelectedBenchmark("")
    setSelectedEngines(["chatgpt", "deepseek", "claude", "doubao"])
    setFrequency("daily")
    setDayOfWeek(1)
    setDayOfMonth(1)
    setHour("09")
    setMinute("00")
    setIsEditing(false)
    setEditingTaskId(null)
  }

  const handleEditTask = (task: ScheduledTask) => {
    setTaskName(task.name)
    setSelectedBenchmark(task.benchmark_id)
    setSelectedEngines(task.engines || ["chatgpt", "deepseek", "claude", "doubao"])
    setFrequency(task.frequency)
    // 确保日期值正确：weekly 默认周一(1)，monthly 默认1号
    setDayOfWeek(task.day_of_week !== undefined && task.day_of_week !== null ? task.day_of_week : 1)
    setDayOfMonth(task.day_of_month !== undefined && task.day_of_month !== null ? task.day_of_month : 1)
    // 解析时间
    const taskTime = task.time || "09:00"
    const [h, m] = taskTime.split(":")
    setHour(h || "09")
    setMinute(m || "00")
    setEditingTaskId(task.id)
    setIsEditing(true)
  }

  const handleStartCreate = () => {
    resetForm()
    setIsEditing(true)
    setEditingTaskId(null)
  }

  const handleSaveTask = async () => {
    if (!taskName || !selectedBenchmark || selectedEngines.length === 0) {
      return
    }

    setIsSaving(true)
    try {
      if (editingTaskId) {
        // Update existing task
        const updated = await scheduledTaskApi.update(projectId, editingTaskId, {
          name: taskName,
          benchmark_id: selectedBenchmark,
          engines: selectedEngines,
          frequency,
          day_of_week: frequency === "weekly" ? dayOfWeek : undefined,
          day_of_month: frequency === "monthly" ? dayOfMonth : undefined,
          time,
        })
        setTasks(tasks.map((t) => (t.id === editingTaskId ? updated : t)))
      } else {
        // Create new task
        await scheduledTaskApi.create(projectId, {
          name: taskName,
          benchmark_id: selectedBenchmark,
          engines: selectedEngines,
          frequency,
          day_of_week: frequency === "weekly" ? dayOfWeek : undefined,
          day_of_month: frequency === "monthly" ? dayOfMonth : undefined,
          time,
          enabled: true,
        })
        await loadTasks()
      }
      resetForm()
    } catch (error) {
      console.error("Failed to save scheduled task:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await scheduledTaskApi.delete(projectId, taskId)
      setTasks(tasks.filter((t) => t.id !== taskId))
    } catch (error) {
      console.error("Failed to delete scheduled task:", error)
    }
  }

  const handleToggleTask = async (taskId: string) => {
    try {
      const updated = await scheduledTaskApi.toggle(projectId, taskId)
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)))
    } catch (error) {
      console.error("Failed to toggle scheduled task:", error)
    }
  }

  const getFrequencyLabel = (task: ScheduledTask): string => {
    if (task.frequency === "daily") {
      return t("scheduledTask.everyDay")
    } else if (task.frequency === "weekly") {
      const days = [
        t("scheduledTask.sunday"),
        t("scheduledTask.monday"),
        t("scheduledTask.tuesday"),
        t("scheduledTask.wednesday"),
        t("scheduledTask.thursday"),
        t("scheduledTask.friday"),
        t("scheduledTask.saturday"),
      ]
      return `${t("scheduledTask.every")} ${days[task.day_of_week || 0]}`
    } else {
      return `${t("scheduledTask.everyMonth")} ${task.day_of_month} ${t("scheduledTask.day")}`
    }
  }

  const enabledTasksCount = tasks.filter((t) => t.enabled).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[85vh] max-h-[85vh] overflow-hidden flex flex-col sm:max-w-[600px]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in oklch, var(--secondary-accent, var(--primary)) 15%, transparent)' }}
            >
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <span>{t("scheduledTask.title")}</span>
          </DialogTitle>
          <DialogDescription>
            {t("scheduledTask.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4 py-4">
            {/* Existing Tasks */}
            {tasks.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t("scheduledTask.existingTasks")}</Label>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <Card key={task.id} className={!task.enabled ? "opacity-50" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Switch
                              checked={task.enabled}
                              onCheckedChange={() => handleToggleTask(task.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{task.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <Badge variant="outline" className="text-xs">
                                  {task.benchmark_name}
                                </Badge>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {getFrequencyLabel(task)} {task.time}
                                </span>
                              </div>
                              <div className="flex gap-1 mt-2">
                                {task.engines.map((engine) => {
                                  const config = ENGINES.find((e) => e.id === engine)
                                  return (
                                    <div
                                      key={engine}
                                      className="h-5 w-5 rounded-full bg-white flex items-center justify-center border shadow-sm"
                                      title={config?.name}
                                    >
                                      <img
                                        src={config?.icon}
                                        alt={config?.name}
                                        className="h-4 w-4 object-contain"
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleEditTask(task)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {task.next_run_at && task.enabled && (
                          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {t("scheduledTask.nextRun")}: {new Date(task.next_run_at).toLocaleString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Create/Edit Task Form */}
            {isEditing ? (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <Label className="text-sm font-medium">
                    {editingTaskId ? t("scheduledTask.editTask") : t("scheduledTask.createNew")}
                  </Label>

                  {/* Task Name */}
                  <div className="space-y-2">
                    <Label htmlFor="taskName" className="text-xs text-muted-foreground">{t("scheduledTask.taskName")}</Label>
                    <Input
                      id="taskName"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      placeholder={t("scheduledTask.taskNamePlaceholder")}
                    />
                  </div>

                  {/* Benchmark Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t("scheduledTask.selectBenchmark")}</Label>
                    <Select value={selectedBenchmark} onValueChange={setSelectedBenchmark}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("scheduledTask.selectBenchmarkPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {benchmarks.filter(b => b.status === "ready").map((bm) => (
                          <SelectItem key={bm.id} value={bm.id}>
                            {bm.name} ({bm.total_questions} {t("runCenter.questions")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Engine Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t("scheduledTask.selectEngines")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ENGINES.map((engine) => (
                        <div
                          key={engine.id}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                            selectedEngines.includes(engine.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => toggleEngine(engine.id)}
                        >
                          <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center overflow-hidden border shrink-0">
                            <img src={engine.icon} alt={engine.name} className="h-5 w-5 object-contain" />
                          </div>
                          <span className="flex-1 truncate">{engine.name}</span>
                          <Checkbox checked={selectedEngines.includes(engine.id)} className="shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Row - Frequency + Day of Week/Month + Time */}
                  <div className={`grid gap-3 ${frequency === "daily" ? "grid-cols-2" : "grid-cols-3"}`}>
                    {/* Frequency */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("scheduledTask.frequency")}</Label>
                      <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">{t("scheduledTask.daily")}</SelectItem>
                          <SelectItem value="weekly">{t("scheduledTask.weekly")}</SelectItem>
                          <SelectItem value="monthly">{t("scheduledTask.monthly")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Day of Week (for weekly) */}
                    {frequency === "weekly" && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("scheduledTask.dayOfWeek")}</Label>
                        <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">{t("scheduledTask.sunday")}</SelectItem>
                            <SelectItem value="1">{t("scheduledTask.monday")}</SelectItem>
                            <SelectItem value="2">{t("scheduledTask.tuesday")}</SelectItem>
                            <SelectItem value="3">{t("scheduledTask.wednesday")}</SelectItem>
                            <SelectItem value="4">{t("scheduledTask.thursday")}</SelectItem>
                            <SelectItem value="5">{t("scheduledTask.friday")}</SelectItem>
                            <SelectItem value="6">{t("scheduledTask.saturday")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Day of Month (for monthly) */}
                    {frequency === "monthly" && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("scheduledTask.dayOfMonth")}</Label>
                        <Select value={String(dayOfMonth)} onValueChange={(v) => setDayOfMonth(Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={String(day)}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Time */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("scheduledTask.time")}</Label>
                      <div className="flex gap-1 items-center">
                        <Select value={hour} onValueChange={setHour}>
                          <SelectTrigger className="w-[70px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((h) => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">:</span>
                        <Select value={minute} onValueChange={setMinute}>
                          <SelectTrigger className="w-[70px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["00", "15", "30", "45"].map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={resetForm} className="flex-1" disabled={isSaving}>
                      {t("common.cancel")}
                    </Button>
                    <Button
                      onClick={handleSaveTask}
                      disabled={!taskName || !selectedBenchmark || selectedEngines.length === 0 || isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : editingTaskId ? (
                        <Save className="mr-2 h-4 w-4" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      {editingTaskId ? t("common.save") : t("scheduledTask.create")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={handleStartCreate}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("scheduledTask.addTask")}
              </Button>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Empty State */}
            {!isLoading && tasks.length === 0 && !isEditing && (
              <div className="text-center py-8">
                <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm">
                  {t("scheduledTask.description")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t pt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {enabledTasksCount} {t("scheduledTask.activeTasks")}
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
