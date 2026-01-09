/**
 * Generate Persona Dialog
 * AI 生成用户画像弹窗组件
 * 支持选择业务场景、生成数量，并显示生成动画
 */

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sparkles,
  Users,
  Briefcase,
  Loader2,
  Check,
  Image as ImageIcon,
  User,
  Wand2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { useProjectStore } from "@/store/project-store"
import { normalizeAvatarUrl } from "@/lib/api/user"
import { API_BASE_URL } from "@/api/config"
import { toast } from "sonner"
import type { Persona, BusinessScope } from "@/api/types"

interface GeneratePersonaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (personas: Persona[]) => void
}

// 生成阶段
type GenerationStage = "idle" | "generating_profiles" | "generating_avatars" | "complete"

// Helper to get business scope display name
const getBusinessScopeName = (scope: BusinessScope, locale: string) => {
  const version = scope.versions?.find(v => v.language === locale) || scope.versions?.[0]
  return version?.product_name || `Business ${scope.id.slice(0, 6)}`
}

export function GeneratePersonaDialog({
  open,
  onOpenChange,
  onSuccess,
}: GeneratePersonaDialogProps) {
  const { t, locale } = useI18n()
  const { currentProject } = useProjectStore()

  // Get business scopes from project assets
  const businessScopes = currentProject?.assets?.business_scopes || []

  // 表单状态
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [backgroundDescription, setBackgroundDescription] = useState<string>("")
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [count, setCount] = useState([2])  // Slider value as array, range 1-3

  // Get available regions based on selected business scope
  const availableRegions = (() => {
    if (selectedBusinessId) {
      const scope = businessScopes.find(s => s.id === selectedBusinessId)
      return scope?.versions?.map(v => ({ region: v.region, language: v.language })) || []
    }
    return []
  })()

  // 生成状态
  const [stage, setStage] = useState<GenerationStage>("idle")
  const [generatedPersonas, setGeneratedPersonas] = useState<Persona[]>([])
  const [avatarProgress, setAvatarProgress] = useState(0)
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(-1)
  const [progressMessage, setProgressMessage] = useState<string>("")  // 用户友好的进度消息

  // 重置状态
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStage("idle")
        setGeneratedPersonas([])
        setAvatarProgress(0)
        setCurrentAvatarIndex(-1)
        setProgressMessage("")
        setSelectedBusinessId("")
        setSelectedRegion("")
        setBackgroundDescription("")
        setCount([2])
      }, 300)
    }
  }, [open])

  // Auto-select first business scope and region when dialog opens
  useEffect(() => {
    if (open && businessScopes.length > 0 && !selectedBusinessId) {
      const firstScope = businessScopes[0]
      setSelectedBusinessId(firstScope.id)
      if (firstScope.versions && firstScope.versions.length > 0) {
        setSelectedRegion(firstScope.versions[0].region)
      }
    }
  }, [open, businessScopes, selectedBusinessId])

  // Auto-select first region when business scope changes
  useEffect(() => {
    if (selectedBusinessId && availableRegions.length > 0 && !selectedRegion) {
      setSelectedRegion(availableRegions[0].region)
    }
  }, [selectedBusinessId, availableRegions, selectedRegion])

  // SSE 连接引用
  const abortControllerRef = useRef<AbortController | null>(null)

  // Typewriter effect for description text
  const typewriterEffect = (text: string, onComplete?: () => void) => {
    setBackgroundDescription("")
    let index = 0
    const speed = 20 // ms per character

    const typeNext = () => {
      if (index < text.length) {
        setBackgroundDescription(text.slice(0, index + 1))
        index++
        setTimeout(typeNext, speed)
      } else {
        onComplete?.()
      }
    }

    typeNext()
  }

  // AI 生成描述
  const handleGenerateDescription = async () => {
    if (!currentProject || !selectedBusinessId) {
      toast.error(t("persona.generate.selectBusinessFirst"))
      return
    }

    setIsGeneratingDescription(true)
    setBackgroundDescription("")

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProject.id}/personas/generate-description`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_scope_id: selectedBusinessId,
            region: selectedRegion,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to generate description")

      const result = await response.json()
      typewriterEffect(result.description, () => {
        setIsGeneratingDescription(false)
        toast.success(t("persona.generate.descriptionGenerated"))
      })
    } catch (error) {
      console.error("Failed to generate description:", error)
      toast.error(t("persona.generate.descriptionFailed"))
      setIsGeneratingDescription(false)
    }
  }

  // 开始生成 - 使用 SSE
  const handleGenerate = async () => {
    if (!currentProject) return
    if (!selectedBusinessId) return
    if (!backgroundDescription.trim()) return

    setStage("generating_profiles")
    setGeneratedPersonas([])
    setAvatarProgress(0)
    setCurrentAvatarIndex(-1)

    // 创建 AbortController 用于取消请求
    abortControllerRef.current = new AbortController()

    // Get scenario info
    const scope = businessScopes.find(s => s.id === selectedBusinessId)
    const version = scope?.versions?.find(v => v.region === selectedRegion) || scope?.versions?.[0]
    const scenario = version?.product_name || "enterprise"
    const language = version?.language || "zh"

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProject.id}/personas/generate/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            count: count[0],
            scenario,
            language,
            business_scope_id: selectedBusinessId,
            region: selectedRegion,
            background_description: backgroundDescription.trim(),
          }),
          signal: abortControllerRef.current.signal,
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      const decoder = new TextDecoder()
      let buffer = ""
      const tempPersonas: Partial<Persona>[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            // 跳过事件类型行，数据在 data: 行中
            continue
          }
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6)
            try {
              const data = JSON.parse(dataStr)
              handleSSEEvent(data, tempPersonas)
            } catch (e) {
              console.warn("Failed to parse SSE data:", e)
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Generation cancelled")
      } else {
        console.error("Failed to generate personas:", error)
      }
      setStage("idle")
    }
  }

  // 获取消息（根据语言）
  const getMessage = (data: Record<string, unknown>) => {
    return (locale === "zh" ? data.message : data.message_en) as string || data.message as string || ""
  }

  // 处理 SSE 事件
  const handleSSEEvent = (data: Record<string, unknown>, tempPersonas: Partial<Persona>[]) => {
    // 根据事件数据判断类型
    if ("industry" in data && "count" in data) {
      // start event
      console.log("Generation started:", data)
    } else if ("message" in data && !("personas" in data) && !("index" in data) && !("total" in data)) {
      // profiles_generating event
      const msg = getMessage(data)
      if (msg) setProgressMessage(msg)
    } else if ("personas" in data && "count" in data && !("total" in data)) {
      // profiles_complete event
      const msg = getMessage(data)
      if (msg) setProgressMessage(msg)
      setStage("generating_avatars")
      const profiles = data.personas as Partial<Persona>[]
      profiles.forEach((p) => tempPersonas.push(p))
      setGeneratedPersonas(
        tempPersonas.map((p, idx) => ({
          id: `temp-${idx}`,
          project_id: "",
          name_zh: p.name_zh || "",
          name_en: p.name_en || "",
          role: p.role || "business",
          decision_power: "",
          description: p.description || "",
          goals: [],
          pain_points: [],
          tags: [],
          color_start: "#3b82f6",
          color_end: "#8b5cf6",
          icon_text: p.name_zh?.[0] || "?",
          is_favorite: false,
          created_at: new Date().toISOString(),
        })) as Persona[]
      )
    } else if ("persona_name" in data && !("avatar_url" in data) && !("success" in data)) {
      // avatar_start event
      const index = data.index as number
      const msg = getMessage(data)
      if (msg) setProgressMessage(msg)
      setCurrentAvatarIndex(index)
    } else if ("avatar_url" in data || ("index" in data && "success" in data)) {
      // avatar_complete event
      const index = data.index as number
      const avatarUrl = data.avatar_url as string | null
      const total = tempPersonas.length || count[0]
      const msg = getMessage(data)
      if (msg) setProgressMessage(msg)

      if (avatarUrl && tempPersonas[index]) {
        tempPersonas[index].avatar = avatarUrl
      }

      setAvatarProgress(((index + 1) / total) * 100)
      setGeneratedPersonas((prev) =>
        prev.map((p, idx) =>
          idx === index && avatarUrl
            ? { ...p, avatar: avatarUrl }
            : p
        )
      )
    } else if ("persona" in data && "index" in data) {
      // persona_saved event
      const savedPersona = data.persona as Partial<Persona>
      const index = data.index as number
      setGeneratedPersonas((prev) =>
        prev.map((p, idx) =>
          idx === index
            ? {
                ...p,
                id: savedPersona.id || p.id,
                avatar: savedPersona.avatar || p.avatar,
                color_start: savedPersona.color_start || p.color_start,
                color_end: savedPersona.color_end || p.color_end,
                icon_text: savedPersona.icon_text || p.icon_text,
              }
            : p
        )
      )
    } else if ("total" in data && "personas" in data) {
      // complete event
      const finalPersonas = data.personas as Persona[]
      setGeneratedPersonas(
        finalPersonas.map((p) => ({
          ...p,
          goals: [],
          pain_points: [],
          is_favorite: false,
          created_at: new Date().toISOString(),
        })) as Persona[]
      )
      setStage("complete")

      // 刷新 personas 列表
      if (currentProject) {
        useProjectStore.getState().loadPersonas(currentProject.id)
      }

      setTimeout(() => {
        onSuccess?.(finalPersonas as Persona[])
      }, 500)
    } else if ("error" in data) {
      // error event
      console.error("Generation error:", data.error)
      setStage("idle")
    }
  }

  // 关闭弹窗
  const handleClose = () => {
    if (stage === "generating_profiles" || stage === "generating_avatars") {
      return // 生成中不允许关闭
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("persona.generate.title")}
          </DialogTitle>
          <DialogDescription>
            {t("persona.generate.description")}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* 配置阶段 */}
          {stage === "idle" && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 py-4"
            >
              {/* 业务场景选择 */}
              {businessScopes.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("persona.generate.selectBusiness")}</Label>
                    <Select
                      value={selectedBusinessId}
                      onValueChange={(value) => {
                        setSelectedBusinessId(value)
                        setSelectedRegion("")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("persona.generate.selectBusinessPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {businessScopes.map((scope) => (
                          <SelectItem key={scope.id} value={scope.id}>
                            {getBusinessScopeName(scope, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("persona.generate.regionLanguage")}</Label>
                    <Select
                      value={selectedRegion}
                      onValueChange={setSelectedRegion}
                      disabled={!selectedBusinessId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("persona.generate.selectRegionPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRegions.map((r) => (
                          <SelectItem key={r.region} value={r.region}>
                            {r.region} ({r.language?.toUpperCase() || "?"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                  <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {t("persona.generate.configureBusinessFirst")}
                  </p>
                </div>
              )}

              {/* 用户故事 (必填) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    {t("persona.generate.userStory")} <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isGeneratingDescription || !selectedBusinessId}
                    onClick={handleGenerateDescription}
                    className="h-7 text-xs gap-1"
                  >
                    {isGeneratingDescription ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t("persona.generate.generating")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        {t("persona.generate.aiGenerate")}
                      </>
                    )}
                  </Button>
                </div>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t("persona.generate.userStoryPlaceholder")}
                  value={backgroundDescription}
                  onChange={(e) => setBackgroundDescription(e.target.value)}
                  disabled={isGeneratingDescription}
                />
                <p className="text-xs text-muted-foreground">
                  {t("persona.generate.userStoryHint")}
                </p>
              </div>

              {/* 生成数量选择 (滑动条 1-3) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t("persona.generate.count")}</Label>
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {count[0]}
                  </span>
                </div>
                <Slider
                  value={count}
                  onValueChange={setCount}
                  min={1}
                  max={3}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  {t("persona.generate.willGenerate", { count: count[0] })}
                </p>
              </div>

              {/* 当前项目信息 */}
              {currentProject && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{currentProject.brand_name}</p>
                    <p className="text-xs text-muted-foreground">{currentProject.industry}</p>
                  </div>
                  <Badge variant="secondary">{t("persona.generate.currentProject")}</Badge>
                </div>
              )}

              {/* 生成按钮 */}
              <Button
                onClick={handleGenerate}
                disabled={businessScopes.length === 0 || !selectedBusinessId || !backgroundDescription.trim()}
                className="w-full"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {t("persona.generate.generatePersonas", { count: count[0] })}
              </Button>
            </motion.div>
          )}

          {/* 生成中阶段 */}
          {(stage === "generating_profiles" || stage === "generating_avatars") && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="py-8"
            >
              <div className="flex flex-col items-center justify-center space-y-6">
                {/* 动画容器 */}
                <div className="relative w-32 h-32">
                  {/* 外圈旋转动画 */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30"
                  />

                  {/* 中圈脉冲动画 */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/5"
                  />

                  {/* 中心图标 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {stage === "generating_profiles" ? (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <User className="h-12 w-12 text-primary" />
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        <ImageIcon className="h-12 w-12 text-primary" />
                      </motion.div>
                    )}
                  </div>

                  {/* 浮动粒子 */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        x: Math.cos((i * 60 * Math.PI) / 180) * 50,
                        y: Math.sin((i * 60 * Math.PI) / 180) * 50,
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeInOut",
                      }}
                      className="absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full bg-primary"
                    />
                  ))}
                </div>

                {/* 状态文字 - 显示用户友好的进度消息 */}
                <div className="text-center space-y-2">
                  <motion.h3
                    key={stage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-semibold"
                  >
                    {stage === "generating_profiles"
                      ? t("persona.generate.generatingProfiles")
                      : t("persona.generate.generatingAvatars")}
                  </motion.h3>
                  <motion.p
                    key={progressMessage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-muted-foreground"
                  >
                    {progressMessage || (stage === "generating_profiles"
                      ? t("persona.generate.profilesHint")
                      : t("persona.generate.avatarsHint"))}
                  </motion.p>
                </div>

                {/* 头像生成进度 */}
                {stage === "generating_avatars" && generatedPersonas.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md space-y-4"
                  >
                    {/* 进度条 */}
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${avatarProgress}%` }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/60 rounded-full"
                      />
                    </div>

                    {/* 头像列表 */}
                    <div className="flex justify-center gap-2 flex-wrap">
                      {generatedPersonas.map((persona, index) => (
                        <motion.div
                          key={persona.id}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{
                            opacity: index <= currentAvatarIndex ? 1 : 0.3,
                            scale: 1,
                          }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          className="relative"
                        >
                          <Avatar
                            className={cn(
                              "h-12 w-12 border-2 transition-all",
                              index <= currentAvatarIndex
                                ? "border-primary"
                                : "border-muted"
                            )}
                          >
                            {persona.avatar && (
                              <AvatarImage src={normalizeAvatarUrl(persona.avatar)} />
                            )}
                            <AvatarFallback
                              className="text-sm font-medium"
                              style={{
                                background: `linear-gradient(135deg, ${persona.color_start}, ${persona.color_end})`,
                                color: "white",
                              }}
                            >
                              {persona.icon_text || persona.name_zh?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          {index === currentAvatarIndex && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                            >
                              <Loader2 className="h-3 w-3 animate-spin" />
                            </motion.div>
                          )}
                          {index < currentAvatarIndex && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center"
                            >
                              <Check className="h-3 w-3" />
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* 完成阶段 */}
          {stage === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-6 space-y-6"
            >
              {/* 成功动画 */}
              <div className="flex flex-col items-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="h-16 w-16 rounded-full bg-green-500 text-white flex items-center justify-center"
                >
                  <Check className="h-8 w-8" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">
                    {t("persona.generate.complete")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("persona.generate.successGenerated", { count: generatedPersonas.length })}
                  </p>
                </div>
              </div>

              {/* 生成的 Persona 预览 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto px-1">
                {generatedPersonas.map((persona, index) => (
                  <motion.div
                    key={persona.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-card"
                  >
                    <Avatar className="h-9 w-9">
                      {persona.avatar && (
                        <AvatarImage src={normalizeAvatarUrl(persona.avatar)} />
                      )}
                      <AvatarFallback
                        className="text-xs font-medium"
                        style={{
                          background: `linear-gradient(135deg, ${persona.color_start}, ${persona.color_end})`,
                          color: "white",
                        }}
                      >
                        {persona.icon_text || persona.name_zh?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{persona.name_zh}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {persona.role}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 完成按钮 */}
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full"
                size="lg"
              >
                {t("common.done")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
