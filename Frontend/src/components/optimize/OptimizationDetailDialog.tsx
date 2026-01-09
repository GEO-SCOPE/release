/**
 * OptimizationDetailDialog - Dialog showing journey optimization issues
 * Allows navigation to workspace to view specific result details
 */

import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Megaphone,
  Trophy,
  Scale,
  Shield,
  Phone,
  Eye,
  TrendingDown,
  ChevronRight,
  User,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { normalizeAvatarUrl } from "@/lib/api"
import { getEngineById } from "@/components/workspace/constants"
import type { JourneyOptimization, OptimizationIssue, JourneyType } from "@/api/types"

// Journey icons and colors
const JOURNEY_CONFIG: Record<JourneyType, {
  icon: React.ElementType
  color: string
  bgColor: string
  i18nKey: string
}> = {
  AWARE: { icon: Search, color: "text-blue-500", bgColor: "bg-blue-500/10", i18nKey: "aware" },
  RECOMMEND: { icon: Megaphone, color: "text-purple-500", bgColor: "bg-purple-500/10", i18nKey: "recommend" },
  CHOOSE: { icon: Trophy, color: "text-amber-500", bgColor: "bg-amber-500/10", i18nKey: "choose" },
  COMPETE: { icon: Scale, color: "text-green-500", bgColor: "bg-green-500/10", i18nKey: "compete" },
  TRUST: { icon: Shield, color: "text-red-500", bgColor: "bg-red-500/10", i18nKey: "trust" },
  CONTACT: { icon: Phone, color: "text-cyan-500", bgColor: "bg-cyan-500/10", i18nKey: "contact" },
}

// Reason config
const REASON_CONFIG = {
  not_mentioned: {
    i18nKey: "optimize.reason.notMentioned",
    icon: Eye,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  ranking_low: {
    i18nKey: "optimize.reason.rankingLow",
    icon: TrendingDown,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  competitor_favored: {
    i18nKey: "optimize.reason.competitorFavored",
    icon: Scale,
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
}

interface OptimizationDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  journey: JourneyOptimization | null
}

export function OptimizationDetailDialog({
  open,
  onOpenChange,
  journey,
}: OptimizationDetailDialogProps) {
  const { t } = useI18n()
  const navigate = useNavigate()

  if (!journey) return null

  const config = JOURNEY_CONFIG[journey.journey]
  const Icon = config.icon

  const handleIssueClick = (issue: OptimizationIssue) => {
    navigate(`/workspace/${issue.run_id}?resultId=${issue.result_id}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[70vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${config.bgColor} flex items-center justify-center shrink-0`}>
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-lg">
                  {t(`optimize.journey.${config.i18nKey}.name`)}
                </DialogTitle>
                <span className="text-sm text-muted-foreground">
                  {t("optimize.issueCount", { count: journey.issue_count })}
                </span>
              </div>
              <DialogDescription className="mt-1">
                {t(`optimize.journey.${config.i18nKey}.desc`)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {journey.issues.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Shield className="h-5 w-5 mr-2 text-green-500" />
                <span className="text-sm">
                  {t("optimize.noIssues")}
                </span>
              </div>
            ) : (
              journey.issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  t={t}
                  onClick={() => handleIssueClick(issue)}
                />
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface IssueCardProps {
  issue: OptimizationIssue
  t: (key: string, params?: Record<string, unknown>) => string
  onClick: () => void
}

function IssueCard({ issue, t, onClick }: IssueCardProps) {
  const reasonConfig = REASON_CONFIG[issue.reason]
  const ReasonIcon = reasonConfig.icon
  const engine = getEngineById(issue.engine)

  // Check if avatar URL exists and is valid
  const hasAvatar = issue.persona_avatar && issue.persona_avatar.length > 0
  const avatarUrl = hasAvatar ? normalizeAvatarUrl(issue.persona_avatar) : null

  return (
    <div
      className="group p-3 rounded-lg border bg-card hover:bg-accent/30 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with engine badge */}
        <div className="relative shrink-0">
          <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-10 w-10 object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          {/* Engine logo badge */}
          {engine && (
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white border border-border shadow-sm flex items-center justify-center overflow-hidden">
              <img
                src={engine.icon}
                alt={engine.name}
                className="h-4 w-4 object-contain"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Question */}
          <p className="text-sm leading-relaxed">{issue.question_text}</p>

          {/* Tags */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge className={`text-xs h-5 ${reasonConfig.className}`}>
              <ReasonIcon className="h-3 w-3 mr-1" />
              {t(reasonConfig.i18nKey)}
            </Badge>
            {issue.ranking && (
              <span className="text-xs text-muted-foreground">
                #{issue.ranking}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </div>
  )
}

export default OptimizationDetailDialog
