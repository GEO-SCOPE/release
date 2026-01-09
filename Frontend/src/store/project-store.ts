/**
 * GEO-SCOPE Project Store
 * Zustand store for managing project state with assets layer
 * Central state management for the entire application
 */
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { storageConfig } from "@/config"
import {
  User,
  Project,
  ProjectAssets,
  ProductFeature,
  BusinessScope,
  Competitor,
  BrandClaim,
  TrustedSource,
  Persona,
  Benchmark,
  BenchmarkStatus,
  Question,
  Run,
  SimulationResult,
  Metrics,
  AIEngine,
  SimulationChannel,
  projectApi,
  personaApi,
  benchmarkApi,
  questionApi,
  runApi,
  sourceApi,
  metricsApi,
  DEFAULT_USER,
  DEFAULT_PROJECT,
  DEFAULT_PERSONAS,
  DEFAULT_BENCHMARKS,
  DEFAULT_TRUSTED_SOURCES,
} from "@/lib/api"

export interface RunProgressLog {
  time: string
  message: string
  type: "info" | "success" | "error"
}

export interface ActiveRunProgress {
  runId: string
  benchmarkId: string
  status: "created" | "running" | "evaluating" | "completed" | "failed"
  totalQuestions: number
  totalCalls: number
  currentQuestion: number
  completedCalls: number
  failedCalls: number
  currentQuestionText: string
  logs: RunProgressLog[]
}

// 缓存条目：存储 results 和版本信息
export interface RunResultsCacheEntry {
  results: SimulationResult[]
  version: string  // 使用 run.completed_at 或 progress.completed 作为版本标识
  fetchedAt: number  // 时间戳，用于可选的过期策略
  total: number  // 总数
  page: number  // 当前已加载的页数
}

// 分页状态
export interface ResultsPagination {
  page: number
  perPage: number
  total: number
  hasMore: boolean
  isLoadingMore: boolean
}

interface ProjectState {
  // =========================================================================
  // User State (B2B SaaS 用户)
  // =========================================================================
  currentUser: User | null

  // =========================================================================
  // Project State
  // =========================================================================
  currentProject: Project | null
  projects: Project[]

  // =========================================================================
  // Assets State (from brand-store)
  // =========================================================================
  trustedSources: TrustedSource[]

  // =========================================================================
  // Personas State
  // =========================================================================
  personas: Persona[]

  // =========================================================================
  // Benchmarks & Questions State
  // =========================================================================
  benchmarks: Benchmark[]
  activeBenchmark: Benchmark | null
  activeQuestions: Question[]

  // =========================================================================
  // Run State (Core simulation)
  // =========================================================================
  runs: Run[]
  currentRun: Run | null
  currentRunResults: SimulationResult[]
  runResultsCache: Record<string, RunResultsCacheEntry>  // runId -> cache entry
  resultsPagination: ResultsPagination  // 分页状态
  runProgress: ActiveRunProgress | null
  isRunStreaming: boolean

  // =========================================================================
  // Metrics State
  // =========================================================================
  metrics: Metrics | null

  // =========================================================================
  // Loading States
  // =========================================================================
  isLoading: boolean
  isGeneratingPersonas: boolean
  isGeneratingQuestions: boolean
  isRunningSimulation: boolean

  // =========================================================================
  // Error State
  // =========================================================================
  error: string | null

  // =========================================================================
  // User Actions
  // =========================================================================
  setCurrentUser: (user: User | null) => void
  updateUserProfile: (data: Partial<User>) => void

  // =========================================================================
  // Project Actions
  // =========================================================================
  loadProjects: () => Promise<void>
  loadProject: (projectId: string) => Promise<void>
  createProject: (data: {
    brand_name: string
    industry: string
    language?: string
  }) => Promise<Project>
  updateProject: (
    projectId: string,
    data: Partial<Project>
  ) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void

  // =========================================================================
  // Assets Actions
  // =========================================================================
  updateAssets: (assets: Partial<ProjectAssets>) => Promise<void>
  addProduct: (product: ProductFeature) => void
  updateProduct: (productId: string, data: Partial<ProductFeature>) => void
  removeProduct: (productId: string) => void
  addBusinessScope: (scope: BusinessScope) => void
  updateBusinessScope: (scopeId: string, data: Partial<BusinessScope>) => void
  removeBusinessScope: (scopeId: string) => void
  addCompetitor: (competitor: Competitor) => void
  updateCompetitor: (competitorId: string, data: Partial<Competitor>) => void
  removeCompetitor: (competitorId: string) => void
  addBrandClaim: (claim: BrandClaim) => void
  updateBrandClaim: (claimId: string, data: Partial<BrandClaim>) => void
  removeBrandClaim: (claimId: string) => void

  // =========================================================================
  // Trusted Sources Actions
  // =========================================================================
  loadTrustedSources: (projectId: string) => Promise<void>
  addTrustedSource: (source: Omit<TrustedSource, "id" | "project_id" | "created_at">) => Promise<void>
  updateTrustedSource: (sourceId: string, data: Partial<TrustedSource>) => Promise<void>
  removeTrustedSource: (sourceId: string) => Promise<void>

  // =========================================================================
  // Personas Actions
  // =========================================================================
  loadPersonas: (projectId: string) => Promise<void>
  createPersona: (
    projectId: string,
    data: Omit<Persona, "id" | "project_id" | "created_at">
  ) => Promise<Persona>
  updatePersona: (
    projectId: string,
    personaId: string,
    data: Partial<Persona>
  ) => Promise<void>
  deletePersona: (projectId: string, personaId: string) => Promise<void>
  generatePersonas: (projectId: string, count?: number) => Promise<void>

  // =========================================================================
  // Benchmarks & Questions Actions
  // =========================================================================
  loadBenchmarks: (projectId: string) => Promise<void>
  loadBenchmarkWithQuestions: (projectId: string, benchmarkId: string) => Promise<Benchmark | null>
  generateBenchmark: (
    projectId: string,
    data: {
      name?: string
      scenario: string
      target_roles: string[]
      questions_per_stage?: number
    }
  ) => Promise<Benchmark>
  activateBenchmark: (projectId: string, benchmarkId: string) => Promise<void>
  updateBenchmarkStatus: (
    projectId: string,
    benchmarkId: string,
    status: BenchmarkStatus
  ) => Promise<void>
  setQuestionRelevance: (
    projectId: string,
    questionId: string,
    relevance: string
  ) => Promise<void>
  approveQuestion: (
    projectId: string,
    questionId: string,
    isApproved: boolean
  ) => Promise<void>

  // =========================================================================
  // Run Actions (Core simulation)
  // =========================================================================
  loadRuns: (projectId: string) => Promise<void>
  loadRun: (projectId: string, runId: string) => Promise<void>
  createRun: (
    projectId: string,
    data: {
      benchmark_id: string
      engines: AIEngine[]
      channels: SimulationChannel[]
      sample_strategy?: "all" | "random"
      sample_size?: number
    }
  ) => Promise<Run>
  retryRun: (projectId: string, runId: string) => Promise<void>
  loadRunResults: (
    projectId: string,
    runId: string,
    params?: {
      page?: number
      per_page?: number
      engine?: AIEngine
      channel?: SimulationChannel
    }
  ) => Promise<void>
  setRunStreaming: (value: boolean) => void
  setRunProgressState: (progress: ActiveRunProgress | null) => void
  updateRunProgressState: (update: Partial<ActiveRunProgress>) => void
  appendRunProgressLogs: (logs: RunProgressLog[]) => void
  invalidateRunCache: (runId: string) => void
  clearRunResultsCache: () => void
  loadMoreResults: (projectId: string, runId: string) => Promise<void>
  updateResult: (result: SimulationResult) => void  // 更新单个结果（如 competitor_analysis）

  // =========================================================================
  // Metrics Actions
  // =========================================================================
  loadMetrics: (projectId: string, engine?: AIEngine | "all") => Promise<void>

  // =========================================================================
  // Utility Actions
  // =========================================================================
  clearError: () => void
  reset: () => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // =====================================================================
      // Initial State
      // =====================================================================
      currentUser: DEFAULT_USER,  // 默认使用e签宝管理员
      currentProject: null,
      projects: [],
      trustedSources: [],
      personas: [],
      benchmarks: [],
      activeBenchmark: null,
      activeQuestions: [],
      runs: [],
      currentRun: null,
      currentRunResults: [],
      runResultsCache: {},
      resultsPagination: {
        page: 1,
        perPage: 50,
        total: 0,
        hasMore: false,
        isLoadingMore: false,
      },
      runProgress: null,
      isRunStreaming: false,
      metrics: null,
      isLoading: false,
      isGeneratingPersonas: false,
      isGeneratingQuestions: false,
      isRunningSimulation: false,
      error: null,

      // =====================================================================
      // User Actions
      // =====================================================================
      setCurrentUser: (user) => {
        set({ currentUser: user })
      },

      updateUserProfile: (data) => {
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, ...data }
            : null,
        }))
      },

      // =====================================================================
      // Project Actions
      // =====================================================================
      loadProjects: async () => {
        set({ isLoading: true, error: null })
        try {
          const { projects } = await projectApi.list()
          set({ projects, isLoading: false })
        } catch (error) {
          // Fallback to default project
          set({
            projects: [DEFAULT_PROJECT],
            isLoading: false,
          })
        }
      },

      loadProject: async (projectId: string) => {
        set({ isLoading: true, error: null })
        try {
          const project = await projectApi.get(projectId)
          set({ currentProject: project, isLoading: false })

          // Load related data in parallel
          await Promise.all([
            get().loadPersonas(projectId),
            get().loadBenchmarks(projectId),
            get().loadTrustedSources(projectId),
            get().loadRuns(projectId),
          ])
        } catch (error) {
          // Fallback to default data
          set({
            currentProject: DEFAULT_PROJECT,
            personas: DEFAULT_PERSONAS,
            benchmarks: DEFAULT_BENCHMARKS,
            activeBenchmark: DEFAULT_BENCHMARKS[0],
            activeQuestions: DEFAULT_BENCHMARKS[0].questions,
            trustedSources: DEFAULT_TRUSTED_SOURCES,
            isLoading: false,
          })
        }
      },

      createProject: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const project = await projectApi.create(data)
          set((state) => ({
            projects: [...state.projects, project],
            currentProject: project,
            isLoading: false,
          }))
          return project
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to create project",
            isLoading: false,
          })
          throw error
        }
      },

      updateProject: async (projectId, data) => {
        set({ isLoading: true, error: null })
        try {
          const project = await projectApi.update(projectId, data)
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId ? project : p
            ),
            currentProject:
              state.currentProject?.id === projectId
                ? project
                : state.currentProject,
            isLoading: false,
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to update project",
            isLoading: false,
          })
          throw error
        }
      },

      deleteProject: async (projectId) => {
        set({ isLoading: true, error: null })
        try {
          await projectApi.delete(projectId)
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== projectId),
            currentProject:
              state.currentProject?.id === projectId
                ? null
                : state.currentProject,
            isLoading: false,
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to delete project",
            isLoading: false,
          })
          throw error
        }
      },

      setCurrentProject: (project) => {
        set({ currentProject: project })
      },

      // =====================================================================
      // Assets Actions
      // =====================================================================
      updateAssets: async (assets) => {
        const { currentProject } = get()
        if (!currentProject) return

        const newAssets = { ...currentProject.assets, ...assets }

        try {
          await projectApi.updateAssets(currentProject.id, newAssets)
        } catch {
          // Silently fail for offline mode, update locally
        }

        set((state) => ({
          currentProject: state.currentProject
            ? { ...state.currentProject, assets: newAssets }
            : null,
        }))
      },

      addProduct: (product) => {
        set((state) => {
          if (!state.currentProject) return state
          const products = [...state.currentProject.assets.products, product]
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, products },
            },
          }
        })
      },

      updateProduct: (productId, data) => {
        set((state) => {
          if (!state.currentProject) return state
          const products = state.currentProject.assets.products.map((p) =>
            p.id === productId ? { ...p, ...data } : p
          )
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, products },
            },
          }
        })
      },

      removeProduct: (productId) => {
        set((state) => {
          if (!state.currentProject) return state
          const products = state.currentProject.assets.products.filter(
            (p) => p.id !== productId
          )
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, products },
            },
          }
        })
      },

      addBusinessScope: (scope) => {
        set((state) => {
          if (!state.currentProject) return state
          const business_scopes = [...(state.currentProject.assets.business_scopes || []), scope]
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, business_scopes },
            },
          }
        })
      },

      updateBusinessScope: (scopeId, data) => {
        set((state) => {
          if (!state.currentProject) return state
          const business_scopes = (state.currentProject.assets.business_scopes || []).map((s) =>
            s.id === scopeId ? { ...s, ...data } : s
          )
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, business_scopes },
            },
          }
        })
      },

      removeBusinessScope: (scopeId) => {
        set((state) => {
          if (!state.currentProject) return state
          const business_scopes = (state.currentProject.assets.business_scopes || []).filter(
            (s) => s.id !== scopeId
          )
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, business_scopes },
            },
          }
        })
      },

      addCompetitor: (competitor) => {
        set((state) => {
          if (!state.currentProject) return state
          const competitors = [...state.currentProject.assets.competitors, competitor]
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, competitors },
            },
          }
        })
      },

      updateCompetitor: (competitorId, data) => {
        set((state) => {
          if (!state.currentProject) return state
          const competitors = state.currentProject.assets.competitors.map((c) =>
            c.id === competitorId ? { ...c, ...data } : c
          )
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, competitors },
            },
          }
        })
      },

      removeCompetitor: (competitorId) => {
        set((state) => {
          if (!state.currentProject) return state
          const competitors = state.currentProject.assets.competitors.filter(
            (c) => c.id !== competitorId
          )
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, competitors },
            },
          }
        })
      },

      addBrandClaim: (claim) => {
        set((state) => {
          if (!state.currentProject) return state
          const brand_claims = [...state.currentProject.assets.brand_claims, claim]
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, brand_claims },
            },
          }
        })
      },

      updateBrandClaim: (claimId, data) => {
        set((state) => {
          if (!state.currentProject) return state
          const brand_claims = state.currentProject.assets.brand_claims.map((c) =>
            c.id === claimId ? { ...c, ...data } : c
          )
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, brand_claims },
            },
          }
        })
      },

      removeBrandClaim: (claimId) => {
        set((state) => {
          if (!state.currentProject) return state
          const brand_claims = state.currentProject.assets.brand_claims.filter(
            (c) => c.id !== claimId
          )
          return {
            currentProject: {
              ...state.currentProject,
              assets: { ...state.currentProject.assets, brand_claims },
            },
          }
        })
      },

      // =====================================================================
      // Trusted Sources Actions
      // =====================================================================
      loadTrustedSources: async (projectId) => {
        try {
          const { sources } = await sourceApi.list(projectId)
          set({ trustedSources: sources })
        } catch {
          set({ trustedSources: DEFAULT_TRUSTED_SOURCES })
        }
      },

      addTrustedSource: async (source) => {
        const { currentProject } = get()
        if (!currentProject) return

        try {
          const newSource = await sourceApi.create(currentProject.id, source)
          set((state) => ({
            trustedSources: [...state.trustedSources, newSource],
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to add source",
          })
          throw error
        }
      },

      updateTrustedSource: async (sourceId, data) => {
        const { currentProject } = get()
        if (!currentProject) return

        try {
          const updated = await sourceApi.update(currentProject.id, sourceId, data)
          set((state) => ({
            trustedSources: state.trustedSources.map((s) =>
              s.id === sourceId ? updated : s
            ),
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to update source",
          })
          throw error
        }
      },

      removeTrustedSource: async (sourceId) => {
        const { currentProject } = get()
        if (!currentProject) return

        try {
          await sourceApi.delete(currentProject.id, sourceId)
          set((state) => ({
            trustedSources: state.trustedSources.filter((s) => s.id !== sourceId),
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to remove source",
          })
          throw error
        }
      },

      // =====================================================================
      // Personas Actions
      // =====================================================================
      loadPersonas: async (projectId) => {
        try {
          const { personas } = await personaApi.list(projectId)
          set({ personas })
        } catch {
          set({ personas: DEFAULT_PERSONAS })
        }
      },

      createPersona: async (projectId, data) => {
        try {
          const persona = await personaApi.create(projectId, data)
          set((state) => ({
            personas: [...state.personas, persona],
          }))
          return persona
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to create persona",
          })
          throw error
        }
      },

      updatePersona: async (projectId, personaId, data) => {
        try {
          const updatedPersona = await personaApi.update(projectId, personaId, data)
          set((state) => ({
            personas: state.personas.map((p) =>
              p.id === personaId ? { ...p, ...updatedPersona } : p
            ),
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to update persona",
          })
          throw error
        }
      },

      deletePersona: async (projectId, personaId) => {
        try {
          await personaApi.delete(projectId, personaId)
          set((state) => ({
            personas: state.personas.filter((p) => p.id !== personaId),
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to delete persona",
          })
          throw error
        }
      },

      generatePersonas: async (projectId, count = 6) => {
        set({ isGeneratingPersonas: true, error: null })
        try {
          const { personas } = await personaApi.generate(projectId, count)
          set((state) => ({
            personas: [...state.personas, ...personas],
            isGeneratingPersonas: false,
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to generate personas",
            isGeneratingPersonas: false,
          })
          throw error
        }
      },

      // =====================================================================
      // Benchmarks & Questions Actions
      // =====================================================================
      loadBenchmarks: async (projectId) => {
        try {
          // Only fetch benchmark list, NOT questions for each (avoid N+1 queries)
          const { benchmarks: benchmarkList } = await benchmarkApi.list(projectId)

          // Add empty questions array - will be lazy loaded when needed
          const benchmarksWithEmptyQuestions = benchmarkList.map((b) => ({
            ...b,
            questions: b.questions || [],
          }))

          const activeBenchmark = benchmarksWithEmptyQuestions.find((b) => b.is_active) || null
          const activeQuestions = activeBenchmark?.questions || []
          set({ benchmarks: benchmarksWithEmptyQuestions, activeBenchmark, activeQuestions })
        } catch {
          set({
            benchmarks: DEFAULT_BENCHMARKS,
            activeBenchmark: DEFAULT_BENCHMARKS[0],
            activeQuestions: DEFAULT_BENCHMARKS[0].questions,
          })
        }
      },

      loadBenchmarkWithQuestions: async (projectId, benchmarkId) => {
        try {
          const { benchmarks } = get()
          const existingBenchmark = benchmarks.find((b) => b.id === benchmarkId)

          // If already has questions loaded, return cached
          if (existingBenchmark && existingBenchmark.questions.length > 0) {
            return existingBenchmark
          }

          // Fetch full benchmark with questions
          const fullBenchmark = await benchmarkApi.get(projectId, benchmarkId)

          // Update in store
          set((state) => ({
            benchmarks: state.benchmarks.map((b) =>
              b.id === benchmarkId ? fullBenchmark : b
            ),
          }))

          return fullBenchmark
        } catch (error) {
          console.error('Failed to load benchmark with questions:', error)
          return null
        }
      },

      generateBenchmark: async (projectId, data) => {
        set({ isGeneratingQuestions: true, error: null })
        try {
          const benchmark = await benchmarkApi.generate(projectId, data as Parameters<typeof benchmarkApi.generate>[1])
          // Ensure new benchmarks are created as draft
          const benchmarkWithDraft: Benchmark = {
            ...benchmark,
            status: benchmark.status || "draft",
          }
          set((state) => ({
            benchmarks: [benchmarkWithDraft, ...state.benchmarks],
            isGeneratingQuestions: false,
          }))
          return benchmarkWithDraft
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to generate benchmark",
            isGeneratingQuestions: false,
          })
          throw error
        }
      },

      activateBenchmark: async (projectId, benchmarkId) => {
        try {
          await benchmarkApi.activate(projectId, benchmarkId)
          set((state) => {
            const benchmarks = state.benchmarks.map((b) => ({
              ...b,
              is_active: b.id === benchmarkId,
            }))
            const activeBenchmark = benchmarks.find((b) => b.id === benchmarkId) || null
            return {
              benchmarks,
              activeBenchmark,
              activeQuestions: activeBenchmark?.questions || [],
            }
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to activate benchmark",
          })
          throw error
        }
      },

      updateBenchmarkStatus: async (projectId, benchmarkId, status) => {
        // Save current state for rollback
        const currentBenchmarks = get().benchmarks
        const currentActiveBenchmark = get().activeBenchmark

        // Update local state immediately (optimistic update)
        const updatedBenchmarks = currentBenchmarks.map((b) =>
          b.id === benchmarkId ? { ...b, status } : b
        )
        const updatedActiveBenchmark = currentActiveBenchmark?.id === benchmarkId
          ? { ...currentActiveBenchmark, status }
          : currentActiveBenchmark

        set({
          benchmarks: updatedBenchmarks,
          activeBenchmark: updatedActiveBenchmark,
        })

        // Call API
        try {
          await benchmarkApi.update(projectId, benchmarkId, { status })
        } catch (error) {
          // Rollback on error
          set({ benchmarks: currentBenchmarks, activeBenchmark: currentActiveBenchmark })
          throw error
        }
      },

      setQuestionRelevance: async (projectId, questionId, relevance) => {
        try {
          await questionApi.setRelevance(projectId, questionId, relevance)
          set((state) => ({
            activeQuestions: state.activeQuestions.map((q) =>
              q.id === questionId ? { ...q, relevance: relevance as Question["relevance"] } : q
            ),
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to update relevance",
          })
          throw error
        }
      },

      approveQuestion: async (projectId, questionId, isApproved) => {
        try {
          await questionApi.approve(projectId, questionId, isApproved)
          set((state) => ({
            activeQuestions: state.activeQuestions.map((q) =>
              q.id === questionId ? { ...q, is_approved: isApproved } : q
            ),
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to approve question",
          })
          throw error
        }
      },

      // =====================================================================
      // Run Actions (Core simulation)
      // =====================================================================
      loadRuns: async (projectId) => {
        // API returns runs list + default_run (first completed run with results)
        const { runs, default_run } = await runApi.list(projectId)
        const { runResultsCache, resultsPagination } = get()

        if (default_run) {
          // Pre-populate currentRun and results from default_run
          const newVersion = default_run.completed_at || String(default_run.progress?.completed || 0)
          set({
            runs,
            currentRun: default_run,
            currentRunResults: default_run.results,
            runResultsCache: {
              ...runResultsCache,
              [default_run.id]: {
                results: default_run.results,
                version: newVersion,
                fetchedAt: Date.now(),
                total: default_run.results_total,
                page: 1,
              },
            },
            resultsPagination: {
              ...resultsPagination,
              page: 1,
              total: default_run.results_total,
              hasMore: default_run.results.length < default_run.results_total,
            },
          })
        } else {
          set({ runs })
        }
      },

      loadRun: async (projectId, runId) => {
        const { runResultsCache, resultsPagination } = get()
        const perPage = resultsPagination.perPage

        set({ isLoading: true })

        // 1. 先只获取 run 基本信息（快速，不含 results）
        const run = await runApi.getRunOnly(projectId, runId)

        // 2. 生成版本标识：使用 completed_at 或 progress.completed
        const newVersion = run.completed_at || String(run.progress?.completed || 0)
        const cachedEntry = runResultsCache[runId]

        // 3. 检查缓存是否命中（版本相同）
        if (cachedEntry && cachedEntry.version === newVersion) {
          // 缓存命中，直接使用缓存数据，跳过 results 请求
          console.log(`[Cache HIT] Run ${runId} - using cached results (${cachedEntry.results.length}/${cachedEntry.total} items)`)
          set({
            currentRun: run,
            currentRunResults: cachedEntry.results,
            resultsPagination: {
              ...resultsPagination,
              page: cachedEntry.page,
              total: cachedEntry.total,
              hasMore: cachedEntry.results.length < cachedEntry.total,
            },
            isLoading: false,
          })
          return
        }

        // 4. 缓存未命中或版本不同，获取第一页 results
        console.log(`[Cache MISS] Run ${runId} - fetching fresh results (page 1, per_page ${perPage})`)
        const { results, total } = await runApi.getResults(projectId, runId, { page: 1, per_page: perPage })

        // 5. 更新 state 和缓存
        set({
          currentRun: run,
          currentRunResults: results,
          runResultsCache: {
            ...runResultsCache,
            [runId]: {
              results,
              version: newVersion,
              fetchedAt: Date.now(),
              total,
              page: 1,
            },
          },
          resultsPagination: {
            ...resultsPagination,
            page: 1,
            total,
            hasMore: results.length < total,
          },
          isLoading: false,
        })
      },

      createRun: async (projectId, data) => {
        set({ isRunningSimulation: true, error: null })
        try {
          const run = await runApi.create(projectId, data)
          set((state) => ({
            runs: [run, ...state.runs],
            currentRun: run,
            isRunningSimulation: false,
          }))
          return run
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to create run",
            isRunningSimulation: false,
          })
          throw error
        }
      },

      retryRun: async (projectId, runId) => {
        set({ isRunningSimulation: true, error: null })
        try {
          const run = await runApi.retry(projectId, runId)
          set((state) => ({
            runs: state.runs.map((r) => (r.id === runId ? run : r)),
            currentRun: state.currentRun?.id === runId ? run : state.currentRun,
            isRunningSimulation: false,
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to retry run",
            isRunningSimulation: false,
          })
          throw error
        }
      },

      loadRunResults: async (projectId, runId, params) => {
        // API layer handles fallback to mock data with filtering
        const { results } = await runApi.getResults(projectId, runId, params)
        set({ currentRunResults: results })
      },

      setRunStreaming: (value) => {
        set({ isRunStreaming: value })
      },

      setRunProgressState: (progress) => {
        set({ runProgress: progress })
      },

      updateRunProgressState: (update) => {
        set((state) => {
          if (!state.runProgress) {
            return {}
          }
          return {
            runProgress: {
              ...state.runProgress,
              ...update,
            },
          }
        })
      },

      appendRunProgressLogs: (logs) => {
        if (!logs?.length) return
        set((state) => {
          if (!state.runProgress) {
            return {}
          }
          return {
            runProgress: {
              ...state.runProgress,
              logs: [...state.runProgress.logs, ...logs],
            },
          }
        })
      },

      invalidateRunCache: (runId) => {
        set((state) => {
          const { [runId]: _, ...rest } = state.runResultsCache
          return { runResultsCache: rest }
        })
      },

      clearRunResultsCache: () => {
        set({ runResultsCache: {} })
      },

      loadMoreResults: async (projectId, runId) => {
        const { resultsPagination, currentRunResults, runResultsCache, currentRun } = get()

        // 如果没有更多数据或正在加载，直接返回
        if (!resultsPagination.hasMore || resultsPagination.isLoadingMore) {
          return
        }

        const nextPage = resultsPagination.page + 1
        const perPage = resultsPagination.perPage

        set({
          resultsPagination: { ...resultsPagination, isLoadingMore: true },
        })

        try {
          console.log(`[Load More] Run ${runId} - fetching page ${nextPage}`)
          const { results: newResults, total } = await runApi.getResults(projectId, runId, {
            page: nextPage,
            per_page: perPage,
          })

          const allResults = [...currentRunResults, ...newResults]
          const newVersion = currentRun?.completed_at || String(currentRun?.progress?.completed || 0)

          set({
            currentRunResults: allResults,
            runResultsCache: {
              ...runResultsCache,
              [runId]: {
                results: allResults,
                version: newVersion,
                fetchedAt: Date.now(),
                total,
                page: nextPage,
              },
            },
            resultsPagination: {
              ...resultsPagination,
              page: nextPage,
              total,
              hasMore: allResults.length < total,
              isLoadingMore: false,
            },
          })
        } catch (error) {
          console.error("[Load More] Failed:", error)
          set({
            resultsPagination: { ...resultsPagination, isLoadingMore: false },
          })
        }
      },

      updateResult: (updatedResult) => {
        const { currentRunResults, runResultsCache, currentRun } = get()

        // 更新 currentRunResults 中的对应结果
        const newResults = currentRunResults.map((r) =>
          r.id === updatedResult.id ? updatedResult : r
        )
        set({ currentRunResults: newResults })

        // 同时更新缓存
        if (currentRun) {
          const cachedEntry = runResultsCache[currentRun.id]
          if (cachedEntry) {
            const newCachedResults = cachedEntry.results.map((r) =>
              r.id === updatedResult.id ? updatedResult : r
            )
            set({
              runResultsCache: {
                ...runResultsCache,
                [currentRun.id]: {
                  ...cachedEntry,
                  results: newCachedResults,
                },
              },
            })
          }
        }
      },

      // =====================================================================
      // Metrics Actions
      // =====================================================================
      loadMetrics: async (projectId, engine) => {
        // API layer handles fallback to DEFAULT_METRICS
        const metrics = await metricsApi.get(projectId, engine)
        set({ metrics })
      },

      // =====================================================================
      // Utility Actions
      // =====================================================================
      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set({
          currentUser: DEFAULT_USER,  // 重置为默认用户
          currentProject: null,
          projects: [],
          trustedSources: [],
          personas: [],
          benchmarks: [],
          activeBenchmark: null,
          activeQuestions: [],
          runs: [],
          currentRun: null,
          currentRunResults: [],
          runResultsCache: {},  // 清除缓存
          resultsPagination: {
            page: 1,
            perPage: 50,
            total: 0,
            hasMore: false,
            isLoadingMore: false,
          },
          metrics: null,
          isLoading: false,
          isGeneratingPersonas: false,
          isGeneratingQuestions: false,
          isRunningSimulation: false,
          error: null,
        })
      },
    }),
    {
      name: storageConfig.projectStoreKey,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        currentProject: state.currentProject,
        trustedSources: state.trustedSources,
        // Only persist lightweight data - NOT results (too large for localStorage)
        runs: state.runs,
        benchmarks: state.benchmarks,
        currentRun: state.currentRun,
        // NOTE: currentRunResults and runResultsCache are NOT persisted
        // because they can exceed localStorage quota (5-10MB limit)
      }),
    }
  )
)
