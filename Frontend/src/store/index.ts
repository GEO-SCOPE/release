/**
 * GEO-SCOPE Store Exports
 * Central export point for stores, types, and configuration
 */

// =============================================================================
// Store Exports
// =============================================================================

// Main project store - central state management (recommended)
export { useProjectStore } from "./project-store"

// Auth store - authentication and token management
export { useAuthStore, getAuthHeader, isLoggedIn } from "./auth-store"

// Legacy brand store - DEPRECATED, use useProjectStore instead
// Kept for backwards compatibility only
export { useBrandStore } from "./brand-store"

// =============================================================================
// Store-specific Types
// =============================================================================
export type { EngineConfig, LocalSettings } from "./types"

// =============================================================================
// Configuration Exports
// =============================================================================
export {
  appConfig,
  APP_MODE,
  API_BASE_URL,
  features,
  storageConfig,
  shouldUseMockData,
  shouldFallbackToMock,
} from "@/config"

export type { AppMode, FeatureFlags, ApiConfig, StorageConfig, AppConfig } from "@/config"

// =============================================================================
// Type Re-exports (from api for convenience)
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
} from "@/api"

// =============================================================================
// Default Data Exports (e签宝)
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
} from "@/api"

// Re-export additional types
export type { ResultsStats, AppInfo, Changelog, ChangelogRelease, ChangelogItem, ChangelogType } from "@/api"
