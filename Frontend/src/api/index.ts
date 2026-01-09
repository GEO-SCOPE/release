/**
 * GEO-SCOPE API Module Index
 * Central export point for all API functions, types, and configuration
 * Target Customer: e签宝 (电子合约 B2B)
 *
 * Usage:
 * import { projectApi, personaApi, ... } from '@/api'
 * import type { Project, Persona, ... } from '@/api'
 */

// =============================================================================
// Configuration Exports
// =============================================================================
export {
  API_BASE_URL,
  API_TIMEOUT,
  API_RETRY_ATTEMPTS,
  API_RETRY_DELAY,
  isMockMode,
  isDevelopMode,
  isReleaseMode,
  ApiError,
  request,
  requestWithFallback,
  requestWithRetry,
} from './config'

// =============================================================================
// Type Exports
// =============================================================================
export type {
  // User
  User,
  // Enums
  PersonaRole,
  IntentType,
  BenchmarkScenario,
  AIEngine,
  SimulationChannel,
  RunStatus,
  SourceTier,
  ClaimVerdict,
  RiskSeverity,
  // Core Types
  ProductFeature,
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
  // Benchmark Version Types
  BenchmarkVersionChangeType,
  BenchmarkVersionSnapshot,
  BenchmarkVersion,
  BenchmarkVersionDetail,
  // Simulation Types
  Citation,
  Source,
  ExtractedClaim,
  RiskFlag,
  CTADetection,
  ClaimSummary,
  SimulationResult,
  RunItem,
  RunSummary,
  Run,
  Metrics,
  JourneyType,
  OptimizationIssue,
  JourneyOptimization,
  // System Types
  AppInfo,
  ChangelogType,
  ChangelogItem,
  ChangelogRelease,
  Changelog,
  // Dashboard Types
  IndustryRanking,
  VisibilityTrendPoint,
  BrandLine,
  DashboardData,
} from './types'

// =============================================================================
// API Client Exports
// =============================================================================
export {
  projectApi,
  personaApi,
  benchmarkApi,
  questionApi,
  runApi,
  sourceApi,
  metricsApi,
  optimizationApi,
  resultsApi,
  userApi,
  systemApi,
  dashboardApi,
  authApi,
  healthCheck,
  normalizeAvatarUrl,
  releaseApi,
} from '@/lib/api'

// Auth types
export type { LoginResponse, AuthVerifyResponse } from '@/lib/api'

// Re-export ResultsStats type from lib/api
export type { ResultsStats } from '@/lib/api'

// =============================================================================
// Default Mock Data Exports (e签宝)
// =============================================================================
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
} from './defaults'
