import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Trash2, Edit2, User } from "lucide-react"
import { useProjectStore } from "@/store/project-store"
import { normalizeAvatarUrl } from "@/lib/api/user"
import { useI18n } from "@/lib/i18n"
import type { Question } from "@/api/types"

export interface QuestionItemProps {
  question: Question
  locale?: "zh" | "en"
  showEdit?: boolean
  showDelete?: boolean
  onEdit?: (question: Question) => void
  onDelete?: (questionId: string) => void
}

export function QuestionItem({
  question,
  showEdit = true,
  showDelete = true,
  onEdit,
  onDelete,
}: QuestionItemProps) {
  const { t } = useI18n()
  const { personas } = useProjectStore()

  // Find matching persona by name
  const matchedPersona = personas.find(
    p => p.name_zh === question.persona_name || p.name_en === question.persona_name
  )

  // Get display name - prefer persona name, fallback to role
  const displayName = question.persona_name || question.persona_role || t("benchmarks.unknown")

  return (
    <div className="group relative rounded-xl bg-card border border-border p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center gap-4">
        {/* Persona Avatar */}
        <Avatar className="shrink-0 w-12 h-12 rounded-xl shadow-lg">
          {matchedPersona?.avatar && (
            <AvatarImage
              src={normalizeAvatarUrl(matchedPersona.avatar)}
              alt={displayName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="rounded-xl bg-muted">
            <User className="w-6 h-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Question Text */}
          <p className="text-sm text-foreground leading-relaxed">
            {question.text}
          </p>

          {/* Tags Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Persona Name/Role */}
            <Badge
              variant="outline"
              className="bg-muted/50 border-border text-muted-foreground text-xs"
            >
              {displayName}
            </Badge>

            {/* Keyword */}
            {question.keyword && (
              <Badge
                variant="outline"
                className="bg-muted/50 border-border text-muted-foreground text-xs"
              >
                KW: {question.keyword}
              </Badge>
            )}

            {/* Source Indicator */}
            {question.source === "Real_Search_Trend" && (
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                {t("benchmarks.question.realTrend")}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 flex items-center gap-1">
          {/* Edit */}
          {showEdit && onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => onEdit(question)}
              title={t("benchmarks.question.edit")}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}

          {/* Delete */}
          {showDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              onClick={() => onDelete(question.id)}
              title={t("benchmarks.question.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionItem
