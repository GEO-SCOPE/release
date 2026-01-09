import { Badge } from "@/components/ui/badge"
import { QuestionItem, type QuestionItemProps } from "./QuestionItem"
import { useI18n } from "@/lib/i18n"
import type { Question, IntentType } from "@/api/types"

// Intent stage configuration (6-stage user journey)
export const INTENT_STAGES: Record<IntentType, {
  labelEn: string
  labelZh: string
  hasBrand: boolean
  gradient: string
  borderColor: string
  description: { en: string; zh: string }
}> = {
  AWARE: {
    labelEn: "1. Aware",
    labelZh: "1. 认知",
    hasBrand: false,
    gradient: "from-slate-500/10 to-slate-600/5 dark:from-slate-500/20 dark:to-slate-600/10",
    borderColor: "border-slate-300 dark:border-slate-500/30",
    description: { en: "Scene-based awareness", zh: "场景化认知" }
  },
  RECOMMEND: {
    labelEn: "2. Recommend",
    labelZh: "2. 推荐",
    hasBrand: false,
    gradient: "from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10",
    borderColor: "border-blue-300 dark:border-blue-500/30",
    description: { en: "Recommendation request", zh: "推荐请求" }
  },
  CHOOSE: {
    labelEn: "3. Choose",
    labelZh: "3. 选择",
    hasBrand: false,
    gradient: "from-cyan-500/10 to-cyan-600/5 dark:from-cyan-500/20 dark:to-cyan-600/10",
    borderColor: "border-cyan-300 dark:border-cyan-500/30",
    description: { en: "Selection & ranking", zh: "选择与排名" }
  },
  TRUST: {
    labelEn: "4. Trust",
    labelZh: "4. 信任",
    hasBrand: true,
    gradient: "from-indigo-500/10 to-indigo-600/5 dark:from-indigo-500/20 dark:to-indigo-600/10",
    borderColor: "border-indigo-300 dark:border-indigo-500/30",
    description: { en: "Trust verification", zh: "信任验证" }
  },
  COMPETE: {
    labelEn: "5. Compete",
    labelZh: "5. 竞争",
    hasBrand: true,
    gradient: "from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10",
    borderColor: "border-purple-300 dark:border-purple-500/30",
    description: { en: "Competitor comparison", zh: "竞品对比" }
  },
  CONTACT: {
    labelEn: "6. Contact",
    labelZh: "6. 接触",
    hasBrand: true,
    gradient: "from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10",
    borderColor: "border-emerald-300 dark:border-emerald-500/30",
    description: { en: "Trial & contact", zh: "试用与接触" }
  },
}

export interface JourneyStageCardProps {
  intent: IntentType
  questions: Question[]
  locale?: "zh" | "en"
  emptyText?: string
  // Question item callbacks
  onEdit?: QuestionItemProps["onEdit"]
  onDelete?: QuestionItemProps["onDelete"]
  // Question item display options
  showEdit?: boolean
  showDelete?: boolean
}

export function JourneyStageCard({
  intent,
  questions,
  emptyText,
  onEdit,
  onDelete,
  showEdit = true,
  showDelete = true,
}: JourneyStageCardProps) {
  const { t, locale } = useI18n()
  const stageInfo = INTENT_STAGES[intent]

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${stageInfo.gradient} border ${stageInfo.borderColor} overflow-hidden`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-lg">
              {locale === "zh" ? stageInfo.labelZh : stageInfo.labelEn}
            </h3>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs ${
                  stageInfo.hasBrand
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-muted/50 text-muted-foreground border-border"
                }`}
              >
                {stageInfo.hasBrand
                  ? t("benchmarks.journey.withBrand")
                  : t("benchmarks.journey.noBrand")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {locale === "zh" ? stageInfo.description.zh : stageInfo.description.en}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="bg-muted/50 border-border text-muted-foreground">
            {questions.length} {t("benchmarks.journey.questionCount")}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {emptyText || t("benchmarks.journey.noQuestions")}
            </p>
          </div>
        ) : (
          questions.map((q) => (
            <QuestionItem
              key={q.id}
              question={q}
              showEdit={showEdit}
              showDelete={showDelete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default JourneyStageCard
