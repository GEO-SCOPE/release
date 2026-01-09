/**
 * GEO-SCOPE Store Types
 *
 * NOTE: All main types are now defined in @/api/types.ts
 * This file re-exports types for backwards compatibility and adds store-specific types.
 *
 * @deprecated Import types from @/api/types instead
 */

// Re-export all types from api/types.ts for backwards compatibility
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
} from "@/api/types"

// ============================================================================
// Store-specific types (not in API layer)
// ============================================================================

/**
 * Engine configuration for settings page
 */
export interface EngineConfig {
  enabled: boolean
  apiKey: string
  endpoint: string
  status: "unknown" | "connected" | "failed"
}

/**
 * Local settings stored in localStorage
 */
export interface LocalSettings {
  engineConfigs: Record<string, EngineConfig>
  theme: "light" | "dark" | "system"
  locale: "en" | "zh"
}

// ============================================================================
// Legacy types - DEPRECATED, use types from @/api/types instead
// ============================================================================

/**
 * @deprecated Use Project from @/api/types instead
 */
export interface BrandInfo {
  id: string
  name: string
  website: string
  industry: string
  founded: string
  tagline: string
  description: string
  logo?: string
}

/**
 * @deprecated Use ProductFeature from @/api/types instead
 */
export interface Product {
  id: string
  name: string
  category: string
  description: string
  status: "active" | "inactive"
  visibilityScore: number
  mentions: number
  citations: number
}

/**
 * @deprecated Use KeyMessage from @/api/types instead
 */
export interface KeyMessage {
  id: string
  title: string
  content: string
  priority: "high" | "medium" | "low"
}

/**
 * @deprecated Use ProjectSettings from @/api/types instead
 */
export interface BrandSettings {
  aiMonitoring: boolean
  autoUpdateBrandInfo: boolean
  sentimentAlerts: boolean
}
