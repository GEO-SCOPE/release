import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"
import { questionApi } from "@/lib/api"
import type { Question, IntentType, PersonaRole } from "@/api/types"

// Intent options
const INTENTS: IntentType[] = ["AWARE", "RECOMMEND", "CHOOSE", "TRUST", "COMPETE", "CONTACT"]

// Role options
const ROLES: PersonaRole[] = ["legal", "business", "it", "security", "procurement", "executive"]

export interface EditQuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  question: Question | null
  projectId: string
  onSuccess?: () => void
}

export function EditQuestionDialog({
  open,
  onOpenChange,
  question,
  projectId,
  onSuccess,
}: EditQuestionDialogProps) {
  const { t } = useI18n()
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [text, setText] = useState("")
  const [intent, setIntent] = useState<IntentType>("AWARE")
  const [personaRole, setPersonaRole] = useState<PersonaRole>("legal")
  const [keyword, setKeyword] = useState("")

  // Sync form state when question changes
  useEffect(() => {
    if (question) {
      setText(question.text || "")
      setIntent(question.intent || "AWARE")
      setPersonaRole(question.persona_role || "legal")
      setKeyword(question.keyword || "")
    }
  }, [question])

  const handleSave = async () => {
    if (!question || !projectId) return

    if (!text.trim()) {
      toast.error(t("benchmarks.question.textRequired"))
      return
    }

    setIsSaving(true)
    try {
      await questionApi.update(projectId, question.id, {
        text: text.trim(),
        intent,
        persona_role: personaRole,
        keyword: keyword.trim(),
      })
      toast.success(t("benchmarks.question.updated"))
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error(t("benchmarks.question.updateFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("benchmarks.editQuestion.title")}</DialogTitle>
          <DialogDescription>{t("benchmarks.editQuestion.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question-text">{t("benchmarks.question.textLabel")}</Label>
            <Textarea
              id="question-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("benchmarks.question.textPlaceholder")}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Intent Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="intent">{t("benchmarks.question.journeyStage")}</Label>
              <Select value={intent} onValueChange={(v) => setIntent(v as IntentType)}>
                <SelectTrigger id="intent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTENTS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {t(`benchmarks.journey.${item.toLowerCase()}` as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Persona Role */}
            <div className="space-y-2">
              <Label htmlFor="persona-role">{t("benchmarks.question.role")}</Label>
              <Select value={personaRole} onValueChange={(v) => setPersonaRole(v as PersonaRole)}>
                <SelectTrigger id="persona-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`benchmarks.role.${role}` as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Keyword */}
          <div className="space-y-2">
            <Label htmlFor="keyword">{t("benchmarks.question.keyword")}</Label>
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t("benchmarks.question.keywordPlaceholder")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
