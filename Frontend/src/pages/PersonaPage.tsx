import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Heart, Target, AlertTriangle, User, Sparkles, RotateCcw } from "lucide-react"
import { CardMasonry } from "@/components/reactbits/Masonry"
import { PageHeader } from "@/components/page-header"
import { GeneratePersonaDialog } from "@/components/personas/GeneratePersonaDialog"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"
import { useProjectStore } from "@/store/project-store"
import { normalizeAvatarUrl } from "@/lib/api/user"
import type { Persona, PersonaGoal, PersonaPainPoint, PersonaRole } from "@/lib/api"

// Role options
const ROLE_OPTIONS: { value: PersonaRole; labelEn: string; labelZh: string }[] = [
  { value: "legal", labelEn: "Legal", labelZh: "法务" },
  { value: "business", labelEn: "Business", labelZh: "业务" },
  { value: "it", labelEn: "IT", labelZh: "IT" },
  { value: "security", labelEn: "Security", labelZh: "安全合规" },
  { value: "procurement", labelEn: "Procurement", labelZh: "采购" },
  { value: "executive", labelEn: "Executive", labelZh: "高管决策" },
]

// Gradient color presets
const COLOR_PRESETS = [
  { start: "#3b82f6", end: "#8b5cf6", name: "Blue Purple" },
  { start: "#10b981", end: "#3b82f6", name: "Green Blue" },
  { start: "#f59e0b", end: "#ef4444", name: "Orange Red" },
  { start: "#ec4899", end: "#8b5cf6", name: "Pink Purple" },
  { start: "#06b6d4", end: "#10b981", name: "Cyan Green" },
  { start: "#6366f1", end: "#ec4899", name: "Indigo Pink" },
]

// Get role label
function getRoleLabel(role: PersonaRole, locale: string): string {
  const found = ROLE_OPTIONS.find(r => r.value === role)
  return found ? (locale === "zh" ? found.labelZh : found.labelEn) : role
}

// Simplified Persona Card Component
function PersonaCard({
  persona,
  onView,
  onEdit,
  onDelete,
  // onToggleFavorite,  // ============== 收藏功能 - 暂时注释 ==============
  locale,
  t,
}: {
  persona: Persona
  onView: (persona: Persona) => void
  onEdit: (persona: Persona) => void
  onDelete: (id: string) => void
  // onToggleFavorite: (id: string, isFavorite: boolean) => void  // ============== 收藏功能 - 暂时注释 ==============
  locale: string
  t: (key: string) => string
}) {
  const goalsCount = persona.goals?.length || 0
  const painPointsCount = persona.pain_points?.length || 0

  return (
    <Card className="group p-5 cursor-pointer" onClick={() => onView(persona)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={normalizeAvatarUrl(persona.avatar)}
              alt={persona.name_zh}
              className="h-14 w-14 object-cover"
            />
          </div>
          {/* Info */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-base leading-tight">
              {locale === "zh" ? persona.name_zh : (persona.name_en || persona.name_zh)}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {getRoleLabel(persona.role, locale)}
              </Badge>
              {/* ============== 收藏图标 - 暂时注释 ==============
              {persona.is_favorite && (
                <Heart className="h-3.5 w-3.5 text-red-500 fill-current" />
              )}
              ============== 收藏图标 - 注释结束 ============== */}
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(persona)}
            title={t("persona.editPersona")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {/* ============== 收藏按钮 - 暂时注释 ==============
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${persona.is_favorite ? "text-red-500" : ""}`}
            onClick={() => onToggleFavorite(persona.id, !persona.is_favorite)}
          >
            <Heart className={`h-4 w-4 ${persona.is_favorite ? "fill-current" : ""}`} />
          </Button>
          ============== 收藏按钮 - 注释结束 ============== */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-destructive"
            onClick={() => onDelete(persona.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Brief Description */}
      {persona.description && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
          {persona.description}
        </p>
      )}

      {/* Goals & Pain Points Summary */}
      {(goalsCount > 0 || painPointsCount > 0) && (
        <div className="flex items-center gap-3 mt-3 text-xs">
          {goalsCount > 0 && (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Target className="h-3.5 w-3.5" />
              <span>{goalsCount} {t("persona.goalsCount")}</span>
            </span>
          )}
          {painPointsCount > 0 && (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{painPointsCount} {t("persona.painPointsCount")}</span>
            </span>
          )}
        </div>
      )}

      {/* Tags */}
      {persona.tags && persona.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {persona.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
          {persona.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{persona.tags.length - 3}</span>
          )}
        </div>
      )}
    </Card>
  )
}

// Persona Detail Dialog
function PersonaDetailDialog({
  persona,
  open,
  onOpenChange,
  locale,
  t: _t,
}: {
  persona: Persona | null
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: string
  t: (key: string) => string
}) {
  if (!persona) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-white flex items-center justify-center overflow-hidden">
              <img
                src={normalizeAvatarUrl(persona.avatar)}
                alt={persona.name_zh}
                className="h-16 w-16 object-cover"
              />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {locale === "zh" ? persona.name_zh : (persona.name_en || persona.name_zh)}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{getRoleLabel(persona.role, locale)}</Badge>
                {persona.decision_power && (
                  <span className="text-xs">{persona.decision_power}</span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Description */}
          {persona.description && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Profile</h4>
              <p className="text-sm leading-relaxed">{persona.description}</p>
            </div>
          )}

          {/* Goals */}
          {persona.goals && persona.goals.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <Target className="h-4 w-4" />
                <span>Strategic Objectives</span>
              </div>
              <ul className="space-y-2">
                {persona.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Badge className="mt-0.5 shrink-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
                      P{goal.priority || i + 1}
                    </Badge>
                    <span>{goal.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pain Points */}
          {persona.pain_points && persona.pain_points.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Critical Challenges</span>
              </div>
              <ul className="space-y-2">
                {persona.pain_points.map((pp, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Badge className="mt-0.5 shrink-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0">
                      L{pp.severity || i + 1}
                    </Badge>
                    <span>{pp.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {persona.tags && persona.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {persona.tags.map(tag => (
                <Badge key={tag} variant="outline">#{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Form data type - aligned with Persona type
interface PersonaFormData {
  name_zh: string
  name_en: string
  role: PersonaRole
  decision_power: string
  description: string
  color_start: string
  color_end: string
  icon_text: string
  tags: string[]
  goals: PersonaGoal[]
  pain_points: PersonaPainPoint[]
}

// Add/Edit Persona Dialog
function PersonaDialog({
  open,
  onOpenChange,
  persona,
  onSave,
  isLoading,
  t,
  locale,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  persona?: Persona | null
  onSave: (data: PersonaFormData) => void
  isLoading: boolean
  t: (key: string) => string
  locale: string
}) {
  const [formData, setFormData] = useState<PersonaFormData>({
    name_zh: "",
    name_en: "",
    role: "business",
    decision_power: "",
    description: "",
    color_start: "#3b82f6",
    color_end: "#8b5cf6",
    icon_text: "",
    tags: [],
    goals: [],
    pain_points: [],
  })

  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    if (persona) {
      setFormData({
        name_zh: persona.name_zh || "",
        name_en: persona.name_en || "",
        role: persona.role || "business",
        decision_power: persona.decision_power || "",
        description: persona.description || "",
        color_start: persona.color_start || "#3b82f6",
        color_end: persona.color_end || "#8b5cf6",
        icon_text: persona.icon_text || "",
        tags: persona.tags || [],
        goals: persona.goals || [],
        pain_points: persona.pain_points || [],
      })
    } else {
      setFormData({
        name_zh: "",
        name_en: "",
        role: "business",
        decision_power: "",
        description: "",
        color_start: "#3b82f6",
        color_end: "#8b5cf6",
        icon_text: "",
        tags: [],
        goals: [],
        pain_points: [],
      })
    }
  }, [persona, open])

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      })
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  const handleSubmit = () => {
    if (!formData.name_zh?.trim()) {
      toast.error(t("persona.nameRequired"))
      return
    }
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {persona ? t("persona.editPersona") : t("persona.addPersona")}
          </DialogTitle>
          <DialogDescription>
            {persona ? t("persona.editPersonaDesc") : t("persona.addPersonaDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Names */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name_zh">{t("persona.nameZh")} *</Label>
              <Input
                id="name_zh"
                value={formData.name_zh}
                onChange={(e) => setFormData({ ...formData, name_zh: e.target.value })}
                placeholder={t("persona.nameZhPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">{t("persona.nameEn")}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder={t("persona.nameEnPlaceholder")}
              />
            </div>
          </div>

          {/* Role & Icon */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">{t("persona.role")}</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as PersonaRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {locale === "zh" ? role.labelZh : role.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon_text">{t("persona.iconText")}</Label>
              <Input
                id="icon_text"
                value={formData.icon_text}
                onChange={(e) => setFormData({ ...formData, icon_text: e.target.value })}
                placeholder={t("persona.iconTextPlaceholder")}
                maxLength={2}
              />
            </div>
          </div>

          {/* Decision Power */}
          <div className="space-y-2">
            <Label htmlFor="decision_power">{t("persona.decisionPower")}</Label>
            <Input
              id="decision_power"
              value={formData.decision_power}
              onChange={(e) => setFormData({ ...formData, decision_power: e.target.value })}
              placeholder={locale === "zh" ? "e.g. 最终决策者、影响者" : "e.g. Final decision maker"}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("persona.description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("persona.descriptionPlaceholder")}
              rows={3}
            />
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Target className="h-4 w-4" />
                {t("persona.goals")}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({
                  ...formData,
                  goals: [...formData.goals, { description: "", priority: formData.goals.length + 1 }]
                })}
              >
                <Plus className="h-3 w-3 mr-1" />
                {t("persona.addTag")}
              </Button>
            </div>
            {formData.goals.map((goal, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  value={goal.description}
                  onChange={(e) => {
                    const newGoals = [...formData.goals]
                    newGoals[index] = { ...goal, description: e.target.value }
                    setFormData({ ...formData, goals: newGoals })
                  }}
                  placeholder={locale === "zh" ? `目标 ${index + 1}` : `Goal ${index + 1}`}
                  className="flex-1"
                />
                <Select
                  value={String(goal.priority)}
                  onValueChange={(value) => {
                    const newGoals = [...formData.goals]
                    newGoals[index] = { ...goal, priority: Number(value) }
                    setFormData({ ...formData, goals: newGoals })
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((p) => (
                      <SelectItem key={p} value={String(p)}>P{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  onClick={() => setFormData({
                    ...formData,
                    goals: formData.goals.filter((_, i) => i !== index)
                  })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Pain Points */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                {t("persona.painPoints")}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({
                  ...formData,
                  pain_points: [...formData.pain_points, { description: "", severity: formData.pain_points.length + 1 }]
                })}
              >
                <Plus className="h-3 w-3 mr-1" />
                {t("persona.addTag")}
              </Button>
            </div>
            {formData.pain_points.map((pp, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  value={pp.description}
                  onChange={(e) => {
                    const newPainPoints = [...formData.pain_points]
                    newPainPoints[index] = { ...pp, description: e.target.value }
                    setFormData({ ...formData, pain_points: newPainPoints })
                  }}
                  placeholder={locale === "zh" ? `痛点 ${index + 1}` : `Pain point ${index + 1}`}
                  className="flex-1"
                />
                <Select
                  value={String(pp.severity)}
                  onValueChange={(value) => {
                    const newPainPoints = [...formData.pain_points]
                    newPainPoints[index] = { ...pp, severity: Number(value) }
                    setFormData({ ...formData, pain_points: newPainPoints })
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <SelectItem key={s} value={String(s)}>L{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  onClick={() => setFormData({
                    ...formData,
                    pain_points: formData.pain_points.filter((_, i) => i !== index)
                  })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>{t("persona.tags")}</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={t("persona.tagPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                {t("persona.addTag")}
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Color Theme */}
          <div className="space-y-2">
            <Label>{t("persona.colorTheme")}</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = formData.color_start === preset.start && formData.color_end === preset.end
                return (
                  <Button
                    key={preset.name}
                    type="button"
                    variant="color-swatch"
                    data-state={isSelected ? "on" : "off"}
                    className="h-8 w-8 rounded-lg p-0"
                    style={{
                      background: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
                    }}
                    onClick={() =>
                      setFormData({ ...formData, color_start: preset.start, color_end: preset.end })
                    }
                    title={preset.name}
                  />
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("persona.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {persona ? t("persona.save") : t("persona.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PersonaPage() {
  const { t, locale } = useI18n()

  const {
    currentProject,
    personas,
    loadPersonas,
    createPersona,
    updatePersona,
    deletePersona,
  } = useProjectStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [viewingPersona, setViewingPersona] = useState<Persona | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentProject) {
      loadPersonas(currentProject.id)
    }
  }, [currentProject, loadPersonas])

  const handleAddPersona = () => {
    setEditingPersona(null)
    setDialogOpen(true)
  }

  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona)
    setDialogOpen(true)
  }

  const handleSavePersona = async (data: PersonaFormData) => {
    if (!currentProject) {
      toast.error("请先选择或创建项目")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingPersona) {
        await updatePersona(currentProject.id, editingPersona.id, data)
        toast.success(t("persona.updateSuccess"))
      } else {
        await createPersona(currentProject.id, {
          ...data,
          is_favorite: false,
        })
        toast.success(t("persona.createSuccess"))
      }
      setDialogOpen(false)
    } catch {
      toast.error("操作失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePersona = async (id: string) => {
    if (!currentProject) return

    try {
      await deletePersona(currentProject.id, id)
      setDeleteConfirmId(null)
      toast.success(t("persona.deleteSuccess"))
    } catch {
      toast.error("删除失败")
    }
  }

  // ============== 收藏功能 - 暂时注释 ==============
  // const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
  //   if (!currentProject) return
  //
  //   try {
  //     await updatePersona(currentProject.id, id, { is_favorite: isFavorite })
  //   } catch {
  //     toast.error("操作失败")
  //   }
  // }
  // ============== 收藏功能 - 注释结束 ==============

  const handleGeneratePersonas = () => {
    if (!currentProject) {
      toast.error(locale === "zh" ? "请先选择项目" : "Please select a project first")
      return
    }
    setGenerateDialogOpen(true)
  }

  const handleGenerateSuccess = (newPersonas: Persona[]) => {
    toast.success(
      locale === "zh"
        ? `成功生成 ${newPersonas.length} 个用户画像`
        : `Successfully generated ${newPersonas.length} personas`
    )
  }

  return (
    <>
      <PageHeader
        title={t("persona.title")}
        description={t("persona.pageDescription")}
      />

      <div className="p-8 space-y-6">
        {!currentProject && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950" disableBackdrop>
            <CardContent className="py-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                请先在项目管理中选择或创建一个项目
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{personas.length} {t("persona.totalPersonas")}</span>
            </div>
            {/* ============== 收藏统计 - 暂时注释 ==============
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-red-500" />
              <span>{personas.filter((p) => p.is_favorite).length} {t("persona.favorites")}</span>
            </div>
            ============== 收藏统计 - 注释结束 ============== */}
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              className="h-9"
              onClick={handleGeneratePersonas}
              disabled={!currentProject}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {t("persona.generate")}
            </Button>
            <Button className="h-9" onClick={handleAddPersona} disabled={!currentProject}>
              <Plus className="mr-2 h-4 w-4" />
              {t("persona.addPersona")}
            </Button>
          </div>
        </div>

        {personas.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("persona.noPersonas")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("persona.noPersonasDesc")}
              </p>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  className="h-9"
                  onClick={handleGeneratePersonas}
                  disabled={!currentProject}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("persona.generate")}
                </Button>
                <Button className="h-9" onClick={handleAddPersona} disabled={!currentProject}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("persona.addFirstPersona")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <CardMasonry columns={{ default: 1, md: 2, lg: 3, xl: 4 }} gap={16}>
            {personas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                onView={setViewingPersona}
                onEdit={handleEditPersona}
                onDelete={(id) => setDeleteConfirmId(id)}
                // onToggleFavorite={handleToggleFavorite}  // ============== 收藏功能 - 暂时注释 ==============
                locale={locale}
                t={t}
              />
            ))}
          </CardMasonry>
        )}
      </div>

      <PersonaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        persona={editingPersona}
        onSave={handleSavePersona}
        isLoading={isSubmitting}
        t={t}
        locale={locale}
      />

      <GeneratePersonaDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        onSuccess={handleGenerateSuccess}
      />

      <PersonaDetailDialog
        persona={viewingPersona}
        open={!!viewingPersona}
        onOpenChange={(open) => !open && setViewingPersona(null)}
        locale={locale}
        t={t}
      />

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("persona.confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("persona.confirmDeleteDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {t("persona.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeletePersona(deleteConfirmId)}
            >
              {t("persona.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
