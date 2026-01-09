/**
 * GEO-SCOPE API Service Layer
 * Connects frontend to FastAPI backend
 * Target Customer: e签宝 (电子合约 B2B)
 */

// Re-export config helpers
export { ApiError, API_BASE_URL, isMockMode } from '@/api/config'

// Re-export types for backward compatibility
export type {
  User,
  PersonaRole,
  IntentType,
  BenchmarkScenario,
  AIEngine,
  SimulationChannel,
  RunStatus,
  SourceTier,
  ClaimVerdict,
  RiskSeverity,
  ProductVersion,
  ProductFeature,
  RegionVersion,
  BusinessScope,
  Competitor,
  BrandClaim,
  TrustedSource,
  ProjectAssets,
  ProjectSettings,
  Project,
  PersonaGoal,
  PersonaPainPoint,
  Persona,
  Question,
  BenchmarkStatus,
  Benchmark,
  BenchmarkVersion,
  BenchmarkVersionDetail,
  BenchmarkVersionChangeType,
  BenchmarkVersionSnapshot,
  Citation,
  Source,
  ExtractedClaim,
  RiskFlag,
  CTADetection,
  ClaimSummary,
  ProductMentionResult,
  SimulationResult,
  RunItem,
  RunSummary,
  Run,
  Metrics,
  JourneyOptimization,
  AppInfo,
  Changelog,
  DashboardData,
  CompetitorAnalysis,
} from '@/api/types'

// Re-export default data
export {
  DEFAULT_USER,
  DEFAULT_PROJECT,
  DEFAULT_PERSONAS,
  DEFAULT_BENCHMARKS,
  DEFAULT_TRUSTED_SOURCES,
  DEFAULT_RUNS,
  DEFAULT_SIMULATION_RESULTS,
  DEFAULT_METRICS,
  DEFAULT_JOURNEY_OPTIMIZATIONS,
  DEFAULT_RESULTS_STATS,
  DEFAULT_APP_INFO,
  DEFAULT_CHANGELOG,
  DEFAULT_DASHBOARD_DATA,
} from '@/api/defaults'

// Export API modules
export { projectApi } from './project'
export { personaApi } from './persona'
export { benchmarkApi } from './benchmark'
export { questionApi } from './question'
export { runApi } from './run'
export { sourceApi } from './source'
export { metricsApi } from './metrics'
export { optimizationApi } from './optimization'
export { resultsApi, type ResultsStats } from './results'
export { userApi, normalizeAvatarUrl } from './user'
export { systemApi } from './system'
export { dashboardApi } from './dashboard'
export { competitorAnalysisApi } from './competitor'
export { authApi, type LoginResponse, type AuthVerifyResponse } from './auth'
export { healthCheck } from './health'
export { scheduledTaskApi, type ScheduledTask, type ScheduledTaskCreate, type ScheduledTaskUpdate } from './scheduledTask'
export { releaseApi } from './release'
