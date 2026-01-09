import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Eye, Trophy, AlertTriangle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Run } from "@/lib/api"

interface RunListItemProps {
  run: Run
  isSelected: boolean
  onClick: () => void
  onDelete?: (e: React.MouseEvent) => void
}

const STATUS_COLORS = {
  completed: "bg-green-500",
  running: "bg-blue-500 animate-pulse",
  failed: "bg-red-500",
  pending: "bg-gray-500",
} as const

export function RunListItem({ run, isSelected, onClick, onDelete }: RunListItemProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all group",
        isSelected && "!border-2 !border-primary"
      )}
      tintOpacity={0.7}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Header: Status, Version, Date */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", STATUS_COLORS[run.status])} />
            <span className="text-sm font-medium">
              {new Date(run.created_at).toLocaleDateString()}
            </span>
            {run.benchmark_version && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-mono opacity-70">
                v{run.benchmark_version}
              </Badge>
            )}
          </div>
          {onDelete && run.status !== "running" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-100"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Metrics row */}
        <div className="text-xs flex items-center gap-3 flex-wrap">
          {/* Progress - only show if running */}
          {run.status === "running" && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Play className="h-3 w-3" />
              {run.progress.completed}/{run.progress.total}
            </span>
          )}
          {/* Visibility rate */}
          <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
            <Eye className="h-3 w-3" />
            {run.summary ? `${(run.summary.visibility_rate * 100).toFixed(0)}%` : "-"}
          </span>
          {/* Effective Ranking */}
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-500">
            <Trophy className="h-3 w-3" />
            {run.summary?.avg_ranking > 0 && run.summary.avg_ranking <= 10
              ? `#${run.summary.avg_ranking.toFixed(1)}`
              : "-"}
          </span>
          {/* Danger Cases */}
          <span className={cn(
            "flex items-center gap-1",
            run.summary?.danger_count > 0 ? "text-orange-600 dark:text-orange-500" : "text-muted-foreground"
          )}>
            <AlertTriangle className="h-3 w-3" />
            {run.summary?.total_results
              ? `${run.summary.danger_count || 0}/${run.summary.total_results}`
              : "-"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
