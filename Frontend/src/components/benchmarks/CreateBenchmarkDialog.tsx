import { useState, useEffect, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sparkles, Upload, RotateCcw, Users,
  Wand2, CheckCircle2, Loader2, AlertCircle, Package, Briefcase, Edit3,
  FileJson, FileSpreadsheet, Download
} from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"
import { useProjectStore } from "@/store/project-store"
import { benchmarkApi } from "@/lib/api"
import type { Benchmark } from "@/api/types"
import { INTENT_STAGES } from "./JourneyStageCard"

// Generation progress state
interface GenerationProgress {
  benchmarkId: string | null
  benchmarkName: string
  currentStage: string
  currentStageName: string
  stageIndex: number
  totalStages: number
  questionsGenerated: number
  totalQuestions: number
  currentQuestions: Array<{ id: string; text: string; persona_name: string; stage: string }>
  error: string | null
}

export interface CreateBenchmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (benchmark: Benchmark) => void
}

export function CreateBenchmarkDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateBenchmarkDialogProps) {
  const { t, locale } = useI18n()
  const { currentProject, loadBenchmarks, personas, loadPersonas } = useProjectStore()

  // Load personas when dialog opens
  useEffect(() => {
    if (open && currentProject?.id) {
      loadPersonas(currentProject.id)
    }
  }, [open, currentProject?.id, loadPersonas])

  const [activeTab, setActiveTab] = useState<"ai" | "import">("ai")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI Generation form state
  const [name, setName] = useState("")
  const [scenarioQuestion, setScenarioQuestion] = useState("")
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([])
  const [questionsPerStage, setQuestionsPerStage] = useState([4])

  // Auto-select first 3 personas when personas change
  useEffect(() => {
    if (personas.length > 0 && selectedPersonaIds.length === 0) {
      setSelectedPersonaIds(personas.slice(0, 3).map(p => p.id))
    }
  }, [personas, selectedPersonaIds.length])

  // Scenario source selection
  const [scenarioSource, setScenarioSource] = useState<"manual" | "product" | "business">("manual")
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false)

  // Get products and business scopes from current project
  const products = currentProject?.assets?.products || []
  const businessScopes = currentProject?.assets?.business_scopes || []

  // Get available regions based on selected product/business
  const availableRegions = (() => {
    if (scenarioSource === "product" && selectedProductId) {
      const product = products.find(p => p.id === selectedProductId)
      return product?.versions?.map(v => ({ region: v.region, language: v.language })) || []
    }
    if (scenarioSource === "business" && selectedBusinessId) {
      const scope = businessScopes.find(s => s.id === selectedBusinessId)
      return scope?.versions?.map(v => ({ region: v.region, language: v.language })) || []
    }
    return []
  })()

  // Helper to get display name from product/business
  const getProductName = (product: typeof products[0]) => {
    const version = product.versions?.[0]
    return version?.name || `Product ${product.id.slice(0, 6)}`
  }

  const getBusinessName = (scope: typeof businessScopes[0]) => {
    const version = scope.versions?.[0]
    return version?.product_name || `Business ${scope.id.slice(0, 6)}`
  }

  // Generation progress state
  const [progress, setProgress] = useState<GenerationProgress>({
    benchmarkId: null,
    benchmarkName: "",
    currentStage: "",
    currentStageName: "",
    stageIndex: 0,
    totalStages: 6,
    questionsGenerated: 0,
    totalQuestions: 0,
    currentQuestions: [],
    error: null,
  })

  // Ref for auto-scrolling question list
  const questionsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest question
  useEffect(() => {
    if (progress.currentQuestions.length > 0) {
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          questionsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
        })
      }, 50)
      return () => clearTimeout(timeoutId)
    }
  }, [progress.currentQuestions.length])

  // Toggle persona selection
  const togglePersona = (personaId: string) => {
    setSelectedPersonaIds(prev =>
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    )
  }

  // Typewriter effect for scenario text
  const typewriterEffect = (text: string, onComplete?: () => void) => {
    setScenarioQuestion("")
    let index = 0
    const speed = 30

    const typeNext = () => {
      if (index < text.length) {
        setScenarioQuestion(text.slice(0, index + 1))
        index++
        setTimeout(typeNext, speed)
      } else {
        onComplete?.()
      }
    }

    typeNext()
  }

  // Handle product selection
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId)
    setSelectedBusinessId("")
    setSelectedRegion("")
  }

  // Handle business scope selection
  const handleBusinessSelect = (businessId: string) => {
    setSelectedBusinessId(businessId)
    setSelectedProductId("")
    setSelectedRegion("")
  }

  // Handle region selection and generate scenario
  const handleRegionSelect = async (region: string) => {
    if (!currentProject) return
    setSelectedRegion(region)

    const regionData = availableRegions.find(r => r.region === region)
    const language = regionData?.language || "zh"
    setSelectedLanguage(language)

    setIsGeneratingScenario(true)
    setScenarioQuestion("")

    try {
      const sourceType = scenarioSource === "product" ? "product" : "business_scope"
      const sourceId = scenarioSource === "product" ? selectedProductId : selectedBusinessId

      const result = await benchmarkApi.generateScenario(currentProject.id, {
        source_type: sourceType,
        source_id: sourceId,
        region: region,
      })
      typewriterEffect(result.scenario, () => {
        setIsGeneratingScenario(false)
        toast.success(t("benchmarks.create.scenarioGenerated"))
      })
    } catch (error) {
      console.error("Failed to generate scenario:", error)
      toast.error(t("benchmarks.create.failedGenerateScenario"))
      setIsGeneratingScenario(false)
    }
  }

  const maxTotalQuestions = selectedPersonaIds.length * questionsPerStage[0] * 6

  // Reset progress
  const resetProgress = () => {
    setProgress({
      benchmarkId: null,
      benchmarkName: "",
      currentStage: "",
      currentStageName: "",
      stageIndex: 0,
      totalStages: 6,
      questionsGenerated: 0,
      totalQuestions: 0,
      currentQuestions: [],
      error: null,
    })
  }

  // Handle AI generation with SSE streaming
  const handleGenerate = async () => {
    if (!currentProject) {
      toast.error(t("benchmarks.create.selectProjectFirst"))
      return
    }

    if (selectedPersonaIds.length === 0) {
      toast.error(t("benchmarks.create.selectPersonaFirst"))
      return
    }

    if (!scenarioQuestion.trim()) {
      toast.error(t("benchmarks.create.enterScenarioFirst"))
      return
    }

    setIsGenerating(true)
    resetProgress()

    try {
      await benchmarkApi.generateStream(
        currentProject.id,
        {
          name: name || undefined,
          scenario: scenarioQuestion,
          target_persona_ids: selectedPersonaIds,
          questions_per_stage: questionsPerStage[0],
          language: selectedLanguage || undefined,
        },
        {
          onBenchmarkCreated: (data) => {
            setProgress(prev => ({
              ...prev,
              benchmarkId: data.benchmark_id,
              benchmarkName: data.name,
              totalQuestions: maxTotalQuestions,
            }))
          },
          onStageStart: (data) => {
            setProgress(prev => ({
              ...prev,
              currentStage: data.stage,
              currentStageName: data.stage_name,
              stageIndex: data.index,
              totalStages: data.total,
            }))
          },
          onQuestionGenerated: (data) => {
            setProgress(prev => ({
              ...prev,
              questionsGenerated: prev.questionsGenerated + 1,
              currentQuestions: [...prev.currentQuestions, {
                id: data.question.id,
                text: data.question.text,
                persona_name: data.question.persona_name,
                stage: data.stage,
              }],
            }))
          },
          onStageComplete: (data) => {
            // Stage completed
          },
          onComplete: async (data) => {
            toast.success(t("benchmarks.create.successGenerated").replace("{count}", String(data.total_questions)))

            await loadBenchmarks(currentProject.id)

            setIsGenerating(false)
            onOpenChange(false)

            setName("")
            setScenarioQuestion("")
            setSelectedPersonaIds([])
            setQuestionsPerStage([4])
            resetProgress()
          },
          onError: (error) => {
            setProgress(prev => ({ ...prev, error }))
            toast.error(`${t("benchmarks.create.generationFailed")}: ${error}`)
            setIsGenerating(false)
          },
        }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`${t("benchmarks.create.generationFailed")}: ${errorMessage}`)
      setIsGenerating(false)
    }
  }

  // Handle file drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith(".json") || file.name.endsWith(".jsonc") || file.name.endsWith(".csv")) {
        setSelectedFile(file)
      } else {
        toast.error(t("benchmarks.create.unsupportedFormat"))
      }
    }
  }, [t])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.name.endsWith(".json") || file.name.endsWith(".jsonc") || file.name.endsWith(".csv")) {
        setSelectedFile(file)
      } else {
        toast.error(t("benchmarks.create.unsupportedFormat"))
      }
    }
  }

  // Handle import
  const handleImport = async () => {
    if (!currentProject || !selectedFile) {
      toast.error(t("benchmarks.create.selectFileFirst"))
      return
    }

    setIsImporting(true)
    try {
      const result = await benchmarkApi.importFile(currentProject.id, selectedFile)
      if (result.success) {
        toast.success(result.message)
        await loadBenchmarks(currentProject.id)
        onOpenChange(false)
        setSelectedFile(null)
      } else {
        toast.error(t("benchmarks.create.importFailed"))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`${t("benchmarks.create.importFailed")}: ${errorMessage}`)
    } finally {
      setIsImporting(false)
    }
  }

  // Handle template download
  const handleTemplateDownload = async (templateType: "legal" | "api") => {
    if (!currentProject) {
      toast.error(t("benchmarks.create.selectProjectFirst"))
      return
    }

    try {
      const template = await benchmarkApi.getTemplate(currentProject.id, templateType)

      // Build dynamic personas section from API response
      const personas = template._project_personas || []
      const isZh = locale === "zh"
      const isJa = locale === "ja"
      const isKo = locale === "ko"
      const isDe = locale === "de"
      const isFr = locale === "fr"
      const isEs = locale === "es"

      // Build personas list for comments
      let personasSection = ""
      if (personas.length > 0) {
        const personaLines = personas.map(p => {
          const name = isZh || isJa || isKo ? p.name_zh : p.name_en
          const desc = p.description || ""
          return ` * - ${p.role}: ${name}${desc ? ` - ${desc}` : ""}`
        }).join("\n")
        personasSection = personaLines
      } else {
        // Fallback to default roles if no personas in project
        if (isZh) {
          personasSection = ` * - legal: 法务
 * - business: 业务
 * - it: IT
 * - security: 安全
 * - procurement: 采购
 * - executive: 高管
 * （提示：请在用户画像页面创建角色后再导入）`
        } else {
          personasSection = ` * - legal: Legal
 * - business: Business
 * - it: IT
 * - security: Security
 * - procurement: Procurement
 * - executive: Executive
 * (Tip: Create personas in the Persona page before importing)`
        }
      }

      // Build template comments with dynamic personas
      const buildComments = () => {
        if (isZh) {
          return `/*
 * GEO-SCOPE Benchmark 问题导入模板
 *
 * ═══════════════════════════════════════════════════════════════
 * 【当前项目可用的 Persona（用户画像）】
 * ═══════════════════════════════════════════════════════════════
${personasSection}
 *
 * ═══════════════════════════════════════════════════════════════
 * 【intent 选项（用户旅程阶段）】
 * ═══════════════════════════════════════════════════════════════
 * - AWARE: 认知 - 用户了解产品/服务的阶段
 * - RECOMMEND: 推荐 - 用户寻求推荐的阶段
 * - CHOOSE: 选择 - 用户做出购买决策的阶段
 * - TRUST: 信任 - 用户验证可信度的阶段
 * - COMPETE: 竞争 - 用户对比竞品的阶段
 * - CONTACT: 联系 - 用户寻求联系方式的阶段
 *
 * ═══════════════════════════════════════════════════════════════
 * 【字段说明】
 * ═══════════════════════════════════════════════════════════════
 * - name: 问题库名称（可选，留空则自动生成）
 * - scenario: 场景故事 - 描述测试场景的文字，用于 AI 生成问题时理解上下文
 * - questions: 问题列表
 *   - text: 问题文本（必填）- 用户会向 AI 提问的实际问题
 *   - intent: 用户旅程阶段（见上方选项）
 *   - persona_name: 角色名称 - 对应上方 Persona 的名称
 *   - persona_role: 角色类型 - 对应上方 Persona 的 role 值
 *   - keyword: 关键词 - 问题的核心关键词，用于分类
 */
`
        } else if (isJa) {
          return `/*
 * GEO-SCOPE Benchmark 質問インポートテンプレート
 *
 * ═══════════════════════════════════════════════════════════════
 * 【現在のプロジェクトで利用可能な Persona】
 * ═══════════════════════════════════════════════════════════════
${personasSection}
 *
 * ═══════════════════════════════════════════════════════════════
 * 【intent オプション（ユーザージャーニーステージ）】
 * ═══════════════════════════════════════════════════════════════
 * - AWARE: 認知 - 製品/サービスについて学ぶ
 * - RECOMMEND: 推薦 - おすすめを求める
 * - CHOOSE: 選択 - 購入決定を行う
 * - TRUST: 信頼 - 信頼性を確認する
 * - COMPETE: 競争 - 競合他社と比較する
 * - CONTACT: 連絡 - 連絡先情報を探す
 *
 * ═══════════════════════════════════════════════════════════════
 * 【フィールド説明】
 * ═══════════════════════════════════════════════════════════════
 * - name: ベンチマーク名（オプション、空欄で自動生成）
 * - scenario: シナリオストーリー - テストシナリオを説明するテキスト
 * - questions: 質問リスト
 *   - text: 質問テキスト（必須）- ユーザーがAIに尋ねる実際の質問
 *   - intent: ユーザージャーニーステージ
 *   - persona_name: ペルソナ名
 *   - persona_role: ペルソナロールタイプ
 *   - keyword: キーワード
 */
`
        } else if (isKo) {
          return `/*
 * GEO-SCOPE Benchmark 질문 가져오기 템플릿
 *
 * ═══════════════════════════════════════════════════════════════
 * 【현재 프로젝트에서 사용 가능한 Persona】
 * ═══════════════════════════════════════════════════════════════
${personasSection}
 *
 * ═══════════════════════════════════════════════════════════════
 * 【intent 옵션 (사용자 여정 단계)】
 * ═══════════════════════════════════════════════════════════════
 * - AWARE: 인지 - 제품/서비스에 대해 학습
 * - RECOMMEND: 추천 - 추천 요청
 * - CHOOSE: 선택 - 구매 결정
 * - TRUST: 신뢰 - 신뢰성 확인
 * - COMPETE: 경쟁 - 경쟁사 비교
 * - CONTACT: 연락 - 연락처 정보 탐색
 *
 * ═══════════════════════════════════════════════════════════════
 * 【필드 설명】
 * ═══════════════════════════════════════════════════════════════
 * - name: 벤치마크 이름 (선택사항, 비어있으면 자동 생성)
 * - scenario: 시나리오 스토리 - 테스트 시나리오를 설명하는 텍스트
 * - questions: 질문 목록
 *   - text: 질문 텍스트 (필수)
 *   - intent: 사용자 여정 단계
 *   - persona_name: 페르소나 이름
 *   - persona_role: 페르소나 역할 유형
 *   - keyword: 키워드
 */
`
        } else if (isDe) {
          return `/*
 * GEO-SCOPE Benchmark Fragen-Import-Vorlage
 *
 * ═══════════════════════════════════════════════════════════════
 * 【Verfügbare Personas im aktuellen Projekt】
 * ═══════════════════════════════════════════════════════════════
${personasSection}
 *
 * ═══════════════════════════════════════════════════════════════
 * 【intent Optionen (User Journey Phasen)】
 * ═══════════════════════════════════════════════════════════════
 * - AWARE: Bewusstsein - Über Produkt/Service lernen
 * - RECOMMEND: Empfehlung - Empfehlungen suchen
 * - CHOOSE: Auswahl - Kaufentscheidung treffen
 * - TRUST: Vertrauen - Glaubwürdigkeit prüfen
 * - COMPETE: Wettbewerb - Mit Wettbewerbern vergleichen
 * - CONTACT: Kontakt - Kontaktinformationen suchen
 *
 * ═══════════════════════════════════════════════════════════════
 * 【Feldbeschreibungen】
 * ═══════════════════════════════════════════════════════════════
 * - name: Benchmark-Name (optional)
 * - scenario: Szenario-Story - Text zur Beschreibung des Testszenarios
 * - questions: Fragenliste
 *   - text: Fragentext (erforderlich)
 *   - intent: User Journey Phase
 *   - persona_name: Persona-Name
 *   - persona_role: Persona-Rollentyp
 *   - keyword: Schlüsselwort
 */
`
        } else if (isFr) {
          return `/*
 * GEO-SCOPE Benchmark Modèle d'importation de questions
 *
 * ═══════════════════════════════════════════════════════════════
 * 【Personas disponibles dans le projet actuel】
 * ═══════════════════════════════════════════════════════════════
${personasSection}
 *
 * ═══════════════════════════════════════════════════════════════
 * 【Options intent (Étapes du parcours utilisateur)】
 * ═══════════════════════════════════════════════════════════════
 * - AWARE: Sensibilisation - Découverte du produit/service
 * - RECOMMEND: Recommandation - Recherche de recommandations
 * - CHOOSE: Choix - Prise de décision d'achat
 * - TRUST: Confiance - Vérification de la crédibilité
 * - COMPETE: Concurrence - Comparaison avec les concurrents
 * - CONTACT: Contact - Recherche d'informations de contact
 *
 * ═══════════════════════════════════════════════════════════════
 * 【Descriptions des champs】
 * ═══════════════════════════════════════════════════════════════
 * - name: Nom du benchmark (optionnel)
 * - scenario: Histoire du scénario - Texte décrivant le scénario de test
 * - questions: Liste des questions
 *   - text: Texte de la question (requis)
 *   - intent: Étape du parcours utilisateur
 *   - persona_name: Nom du persona
 *   - persona_role: Type de rôle du persona
 *   - keyword: Mot-clé
 */
`
        } else if (isEs) {
          return `/*
 * GEO-SCOPE Benchmark Plantilla de importación de preguntas
 *
 * ═══════════════════════════════════════════════════════════════
 * 【Personas disponibles en el proyecto actual】
 * ═══════════════════════════════════════════════════════════════
${personasSection}
 *
 * ═══════════════════════════════════════════════════════════════
 * 【Opciones de intent (Etapas del viaje del usuario)】
 * ═══════════════════════════════════════════════════════════════
 * - AWARE: Conciencia - Aprendiendo sobre el producto/servicio
 * - RECOMMEND: Recomendación - Buscando recomendaciones
 * - CHOOSE: Elección - Tomando decisión de compra
 * - TRUST: Confianza - Verificando credibilidad
 * - COMPETE: Competencia - Comparando con competidores
 * - CONTACT: Contacto - Buscando información de contacto
 *
 * ═══════════════════════════════════════════════════════════════
 * 【Descripciones de campos】
 * ═══════════════════════════════════════════════════════════════
 * - name: Nombre del benchmark (opcional)
 * - scenario: Historia del escenario - Texto que describe el escenario de prueba
 * - questions: Lista de preguntas
 *   - text: Texto de la pregunta (requerido)
 *   - intent: Etapa del viaje del usuario
 *   - persona_name: Nombre del persona
 *   - persona_role: Tipo de rol del persona
 *   - keyword: Palabra clave
 */
`
        } else {
          // English (default)
          return `/*
 * GEO-SCOPE Benchmark Question Import Template
 *
 * ═══════════════════════════════════════════════════════════════
 * 【Available Personas in Current Project】
 * ═══════════════════════════════════════════════════════════════
${personasSection}
 *
 * ═══════════════════════════════════════════════════════════════
 * 【intent Options (User Journey Stages)】
 * ═══════════════════════════════════════════════════════════════
 * - AWARE: Aware - User learning about product/service
 * - RECOMMEND: Recommend - User seeking recommendations
 * - CHOOSE: Choose - User making purchase decision
 * - TRUST: Trust - User verifying credibility
 * - COMPETE: Compete - User comparing competitors
 * - CONTACT: Contact - User looking for contact info
 *
 * ═══════════════════════════════════════════════════════════════
 * 【Field Descriptions】
 * ═══════════════════════════════════════════════════════════════
 * - name: Benchmark name (optional, auto-generated if empty)
 * - scenario: Scenario story - Text describing the test scenario context
 * - questions: List of questions
 *   - text: Question text (required) - The actual question users will ask AI
 *   - intent: User journey stage (see options above)
 *   - persona_name: Persona name - Matches the name from available Personas
 *   - persona_role: Persona role type - Matches the role from available Personas
 *   - keyword: Keyword - Core keyword for categorization
 */
`
        }
      }

      const headerComments = buildComments()

      // Determine if we should use English content based on locale
      const useEnglish = !isZh && !isJa && !isKo

      // Create clean template data with appropriate language version
      const templateData = {
        name: useEnglish ? template.name_en : template.name,
        scenario: useEnglish ? (template.scenario_en || template.scenario) : template.scenario,
        questions: template.questions.map(q => ({
          text: useEnglish ? (q.text_en || q.text) : q.text,
          intent: q.intent,
          persona_name: useEnglish ? (q.persona_name_en || q.persona_name) : q.persona_name,
          persona_role: q.persona_role,
          keyword: useEnglish ? (q.keyword_en || q.keyword) : q.keyword,
        })),
      }

      // Combine comments and JSON
      const fileContent = headerComments + JSON.stringify(templateData, null, 2)

      // Download as .jsonc (JSON with comments)
      const blob = new Blob([fileContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${templateType}_template.jsonc`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(t("benchmarks.create.templateDownloaded"))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`${t("benchmarks.create.templateDownloadFailed")}: ${errorMessage}`)
    }
  }

  // Handle use template (import template directly)
  const handleUseTemplate = async (templateType: "legal" | "api") => {
    if (!currentProject) {
      toast.error(t("benchmarks.create.selectProjectFirst"))
      return
    }

    setIsImporting(true)
    try {
      const template = await benchmarkApi.getTemplate(currentProject.id, templateType)
      const result = await benchmarkApi.import(currentProject.id, {
        name: template.name,
        scenario: template.scenario,
        questions: template.questions,
      })
      if (result.success) {
        toast.success(result.message)
        await loadBenchmarks(currentProject.id)
        onOpenChange(false)
      } else {
        toast.error(t("benchmarks.create.importFailed"))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`${t("benchmarks.create.importFailed")}: ${errorMessage}`)
    } finally {
      setIsImporting(false)
    }
  }

  // Calculate progress percentage
  const progressPercent = progress.totalQuestions > 0
    ? Math.round((progress.questionsGenerated / progress.totalQuestions) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("benchmarks.create.title")}</DialogTitle>
          <DialogDescription>{t("benchmarks.create.description")}</DialogDescription>
        </DialogHeader>

        {/* Generation Progress View */}
        {isGenerating ? (
          <div className="space-y-4 py-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">{t("benchmarks.create.generatingQuestions")}</span>
            </div>

            {/* Benchmark Info */}
            {progress.benchmarkName && (
              <div className="text-sm text-muted-foreground">
                {t("benchmarks.create.benchmarkLabel")}: {progress.benchmarkName}
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {t("benchmarks.create.stageProgress")
                    .replace("{current}", String(progress.stageIndex))
                    .replace("{total}", String(progress.totalStages))}: {progress.currentStageName}
                </span>
                <span>{progress.questionsGenerated} / {progress.totalQuestions}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Stage Progress */}
            <div className="flex gap-1">
              {Object.entries(INTENT_STAGES).map(([key, stage], index) => (
                <div
                  key={key}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    index + 1 < progress.stageIndex
                      ? "bg-primary"
                      : index + 1 === progress.stageIndex
                      ? "bg-primary/50 animate-pulse"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Working Personas */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">{t("benchmarks.create.generatingFor")}</span>
              {personas
                .filter(p => selectedPersonaIds.includes(p.id))
                .map(persona => (
                  <Badge key={persona.id} variant="outline" className="animate-pulse">
                    {persona.name_zh || persona.name_en || persona.role}
                  </Badge>
                ))}
            </div>

            {/* Current Questions */}
            <ScrollArea className="h-[200px] border rounded-md p-3">
              <div className="space-y-2">
                {progress.currentQuestions.map((q) => {
                  const stageInfo = INTENT_STAGES[q.stage as keyof typeof INTENT_STAGES]
                  return (
                    <div key={q.id} className="flex items-start gap-2 text-sm animate-in fade-in slide-in-from-bottom-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {stageInfo ? (locale === "zh" ? stageInfo.labelZh : stageInfo.labelEn) : q.stage}
                          </Badge>
                          <span className="text-muted-foreground text-xs">[{q.persona_name}]</span>
                        </div>
                        <span className="line-clamp-2 text-xs">{q.text}</span>
                      </div>
                    </div>
                  )
                })}
                {progress.currentQuestions.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">
                      {t("benchmarks.create.aiGeneratingFor").replace("{stage}", progress.currentStageName || "...")}
                    </span>
                    <span className="text-xs">{t("benchmarks.create.stageTime")}</span>
                  </div>
                )}
                <div ref={questionsEndRef} />
              </div>
            </ScrollArea>

            {/* Error */}
            {progress.error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {progress.error}
              </div>
            )}
          </div>
        ) : (
          /* Normal Form View */
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ai" | "import")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="h-4 w-4" />
                {t("benchmarks.create.aiGenerate")}
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-2">
                <Upload className="h-4 w-4" />
                {t("benchmarks.create.import")}
              </TabsTrigger>
            </TabsList>

            {/* AI Generation Tab */}
            <TabsContent value="ai" className="space-y-6 mt-4">
              {/* Benchmark Name */}
              <div className="space-y-2">
                <Label>{t("benchmarks.create.nameLabel")}</Label>
                <Input
                  placeholder={t("benchmarks.create.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Scenario Source Selection */}
              <div className="space-y-3">
                <Label>{t("benchmarks.create.scenarioSource")}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={scenarioSource === "manual" ? "default" : "outline"}
                    onClick={() => setScenarioSource("manual")}
                    className="flex-1"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    {t("benchmarks.create.manual")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={scenarioSource === "product" ? "default" : "outline"}
                    onClick={() => setScenarioSource("product")}
                    disabled={products.length === 0}
                    className="flex-1"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    {t("benchmarks.create.fromProduct")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={scenarioSource === "business" ? "default" : "outline"}
                    onClick={() => setScenarioSource("business")}
                    disabled={businessScopes.length === 0}
                    className="flex-1"
                  >
                    <Briefcase className="h-4 w-4 mr-1" />
                    {t("benchmarks.create.fromBusiness")}
                  </Button>
                </div>
              </div>

              {/* Product + Region Selector */}
              {(scenarioSource === "product" && products.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("benchmarks.create.selectProduct")}</Label>
                    <Select value={selectedProductId} onValueChange={handleProductSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("benchmarks.create.selectProductPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {getProductName(product)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("benchmarks.create.regionLanguage")}</Label>
                    <Select
                      value={selectedRegion}
                      onValueChange={handleRegionSelect}
                      disabled={!selectedProductId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("benchmarks.create.selectRegionPlaceholder")} />
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
              )}

              {/* Business + Region Selector */}
              {(scenarioSource === "business" && businessScopes.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("benchmarks.create.selectBusiness")}</Label>
                    <Select value={selectedBusinessId} onValueChange={handleBusinessSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("benchmarks.create.selectBusinessPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {businessScopes.map((scope) => (
                          <SelectItem key={scope.id} value={scope.id}>
                            {getBusinessName(scope)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("benchmarks.create.regionLanguage")}</Label>
                    <Select
                      value={selectedRegion}
                      onValueChange={handleRegionSelect}
                      disabled={!selectedBusinessId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("benchmarks.create.selectRegionPlaceholder")} />
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
              )}

              {/* Scenario Question */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("benchmarks.create.scenarioQuestion")} <span className="text-destructive">*</span></Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={
                      isGeneratingScenario ||
                      (scenarioSource === "product" && (!selectedProductId || !selectedRegion)) ||
                      (scenarioSource === "business" && (!selectedBusinessId || !selectedRegion)) ||
                      (scenarioSource === "manual" && products.length === 0 && businessScopes.length === 0)
                    }
                    onClick={async () => {
                      if (!currentProject) return

                      if ((scenarioSource === "product" && selectedProductId && selectedRegion) ||
                          (scenarioSource === "business" && selectedBusinessId && selectedRegion)) {
                        handleRegionSelect(selectedRegion)
                        return
                      }

                      setIsGeneratingScenario(true)
                      setScenarioQuestion("")
                      try {
                        if (products.length > 0) {
                          const firstRegion = products[0].versions?.[0]?.region
                          const result = await benchmarkApi.generateScenario(currentProject.id, {
                            source_type: "product",
                            source_id: products[0].id,
                            region: firstRegion,
                          })
                          typewriterEffect(result.scenario, () => {
                            setIsGeneratingScenario(false)
                            toast.success(t("benchmarks.create.scenarioGenerated"))
                          })
                        } else if (businessScopes.length > 0) {
                          const firstRegion = businessScopes[0].versions?.[0]?.region
                          const result = await benchmarkApi.generateScenario(currentProject.id, {
                            source_type: "business_scope",
                            source_id: businessScopes[0].id,
                            region: firstRegion,
                          })
                          typewriterEffect(result.scenario, () => {
                            setIsGeneratingScenario(false)
                            toast.success(t("benchmarks.create.scenarioGenerated"))
                          })
                        } else {
                          toast.error(t("benchmarks.create.addProductFirst"))
                          setIsGeneratingScenario(false)
                        }
                      } catch (error) {
                        console.error("Failed to generate scenario:", error)
                        toast.error(t("benchmarks.create.failedGenerateScenario"))
                        setIsGeneratingScenario(false)
                      }
                    }}
                    className="h-7 text-xs gap-1"
                  >
                    {isGeneratingScenario ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t("benchmarks.create.generating")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        {t("benchmarks.create.aiGenerate")}
                      </>
                    )}
                  </Button>
                </div>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t("benchmarks.create.scenarioPlaceholder")}
                  value={scenarioQuestion}
                  onChange={(e) => setScenarioQuestion(e.target.value)}
                  disabled={isGeneratingScenario}
                />
                <p className="text-xs text-muted-foreground">
                  {scenarioSource !== "manual"
                    ? t("benchmarks.create.scenarioHintProduct")
                    : t("benchmarks.create.scenarioHintManual")
                  }
                </p>
              </div>

              {/* Target Personas */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("benchmarks.create.targetPersonas")}
                </Label>
                {personas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {personas.map((persona) => (
                      <Badge
                        key={persona.id}
                        variant={selectedPersonaIds.includes(persona.id) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => togglePersona(persona.id)}
                      >
                        {selectedPersonaIds.includes(persona.id) && (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {persona.name_zh || persona.name_en || persona.role}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("benchmarks.create.noPersonas")}
                  </p>
                )}
              </div>

              {/* Max Questions per Stage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t("benchmarks.create.maxQuestionsPerStage")}</Label>
                  <span className="text-sm font-medium">
                    {t("benchmarks.create.upTo")} <span className="text-primary">{maxTotalQuestions}</span> {t("benchmarks.create.questionsUnit")}
                  </span>
                </div>
                <Slider
                  value={questionsPerStage}
                  onValueChange={setQuestionsPerStage}
                  min={1}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  {t("benchmarks.create.personaCalculation")
                    .replace("{personas}", String(selectedPersonaIds.length))
                    .replace("{questions}", String(questionsPerStage[0]))}
                </p>
              </div>

              {/* Journey Stages Preview */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {t("benchmarks.create.journeyStages")}
                </Label>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(INTENT_STAGES).map(([key, stage]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {locale === "zh" ? stage.labelZh : stage.labelEn}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || selectedPersonaIds.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                    {t("benchmarks.create.generating")}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {t("benchmarks.create.generateQuestions").replace("{count}", String(maxTotalQuestions))}
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Import Tab */}
            <TabsContent value="import" className="space-y-6 mt-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.jsonc,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Drag & Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : selectedFile
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-muted-foreground/25"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <>
                    {selectedFile.name.endsWith(".json") || selectedFile.name.endsWith(".jsonc") ? (
                      <FileJson className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    ) : (
                      <FileSpreadsheet className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    )}
                    <h3 className="font-medium mb-2 text-green-600 dark:text-green-400">
                      {selectedFile.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedFile(null)}
                      >
                        {t("benchmarks.create.removeFile")}
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={isImporting}
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("benchmarks.create.importing")}
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {t("benchmarks.create.importFile")}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">{t("benchmarks.create.dragDropUpload")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("benchmarks.create.supportedFormats")}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t("benchmarks.create.selectFile")}
                    </Button>
                  </>
                )}
              </div>

              {/* Template Section */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  {t("benchmarks.create.orStartTemplate")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Legal Template */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FileJson className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{t("benchmarks.create.legalTemplate")}</h4>
                        <p className="text-xs text-muted-foreground">6 {t("benchmarks.create.questionsUnit")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleTemplateDownload("legal")}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {t("benchmarks.create.download")}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUseTemplate("legal")}
                        disabled={isImporting}
                      >
                        {isImporting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          t("benchmarks.create.useTemplate")
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* API Template */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <FileJson className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{t("benchmarks.create.apiTemplate")}</h4>
                        <p className="text-xs text-muted-foreground">6 {t("benchmarks.create.questionsUnit")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleTemplateDownload("api")}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {t("benchmarks.create.download")}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUseTemplate("api")}
                        disabled={isImporting}
                      >
                        {isImporting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          t("benchmarks.create.useTemplate")
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CreateBenchmarkDialog
