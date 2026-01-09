import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, FileText, Users, CheckCircle2, Circle, Play, Loader2 } from "lucide-react"
import type { Benchmark, PersonaRole, BenchmarkStatus } from "@/api/types"
import { useI18n } from "@/lib/i18n"

// Status config - icon and color only
const STATUS_CONFIG: Record<BenchmarkStatus, { color: string; icon: typeof CheckCircle2 }> = {
  draft: {
    color: "bg-muted text-muted-foreground border-border",
    icon: Circle
  },
  generating: {
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200",
    icon: Loader2
  },
  ready: {
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200",
    icon: CheckCircle2
  },
  running: {
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200",
    icon: Loader2
  },
  archived: {
    color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200",
    icon: Circle
  },
}

export interface BenchmarkCardProps {
  benchmark: Benchmark
  locale?: "zh" | "en"
  isSelected?: boolean
  isRunning?: boolean
  onClick?: (benchmark: Benchmark) => void
  onRun?: (benchmark: Benchmark) => void
}

export function BenchmarkCard({
  benchmark,
  isSelected = false,
  isRunning = false,
  onClick,
  onRun,
}: BenchmarkCardProps) {
  const { t } = useI18n()
  const date = new Date(benchmark.created_at)
  const formattedDate = date.toLocaleDateString()
  const formattedTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  // Get scenario label from i18n
  const getScenarioLabel = (scenario: string) => {
    const key = `benchmarks.scenario.${scenario}` as const
    const translated = t(key as any)
    // If translation not found, return original scenario
    return translated === key ? scenario : translated
  }

  // Get role label from i18n
  const getRoleLabel = (role: string) => {
    const key = `benchmarks.role.${role}` as const
    const translated = t(key as any)
    // If translation not found, return original role
    return translated === key ? role : translated
  }

  // Get status label from i18n
  const getStatusLabel = (status: BenchmarkStatus) => {
    return t(`benchmarks.${status}` as any)
  }

  const status = benchmark.status || "ready"
  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""} ${isRunning ? "ring-2 ring-primary/50 animate-pulse" : ""}`}
      onClick={() => onClick?.(benchmark)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: Date + Status + Run */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formattedDate} {formattedTime}
          </Badge>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {getStatusLabel(status)}
            </Badge>
            {onRun && status === "ready" && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${isRunning ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                disabled={isRunning}
                onClick={(e) => {
                  e.stopPropagation()
                  onRun(benchmark)
                }}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Name & Scenario */}
        <div className="space-y-1">
          <p className="font-medium text-sm line-clamp-1">{benchmark.name}</p>
          <p className="text-xs text-muted-foreground">
            {getScenarioLabel(benchmark.scenario)}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {benchmark.questions?.length || benchmark.total_questions || 0} {t("benchmarks.questionCount")}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {(() => {
              let roles: string[] = benchmark.target_roles || []
              if (roles.length === 0 && benchmark.questions?.length) {
                roles = [...new Set(benchmark.questions.map(q => q.persona_role).filter(Boolean))]
              }
              if (roles.length === 0) return "-"
              return roles
                .map(r => getRoleLabel(r))
                .filter(Boolean)
                .join(", ")
            })()}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}

export default BenchmarkCard
