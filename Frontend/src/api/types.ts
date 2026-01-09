/**
 * GEO-SCOPE API Types
 * All TypeScript types used across the API layer
 * Target Customer: e签宝 (电子合约 B2B)
 */

// =============================================================================
// User Types (B2B SaaS 用户模型)
// =============================================================================

export interface User {
  id: string
  email: string
  name: string              // 联系人姓名
  avatar?: string           // 头像URL
  company_name: string      // 公司名称（B2B客户）
  role: "admin" | "member"  // 用户角色
  created_at: string
}

// =============================================================================
// Enums
// =============================================================================

export type PersonaRole = "legal" | "business" | "it" | "security" | "procurement" | "executive"
export type IntentType = "AWARE" | "RECOMMEND" | "CHOOSE" | "TRUST" | "COMPETE" | "CONTACT"
export type BenchmarkScenario = "legal_validity" | "api_integration" | "security_compliance" | "competitor_compare" | "pricing_value" | "industry_solution"
export type AIEngine = "chatgpt" | "deepseek" | "claude" | "doubao"
export type SimulationChannel = "search" | "chat"
export type RunStatus = "pending" | "running" | "completed" | "failed"
export type SourceTier = "official" | "authority" | "media" | "untrusted"
export type ClaimVerdict = "supported" | "contradicted" | "unclear"
export type RiskSeverity = "high" | "medium" | "low"

// =============================================================================
// Core Types
// =============================================================================

export interface ProductVersion {
  region: string        // 地区名称，如 "中国大陆", "Singapore"
  name: string          // 该地区的产品名称
  description: string   // 该地区的产品描述
  language: string      // 语言代码，如 "zh", "en", "ja", "ko"
}

export interface ProductFeature {
  id: string
  versions: ProductVersion[]  // 地区版本列表
}

// 地区版本（每个地区独立配置产品名、描述和语言）
export interface RegionVersion {
  region: string           // 地区名，如 "中国大陆", "新加坡"
  product_name: string     // 该地区的产品名称
  description: string      // 该地区的产品描述
  language: string         // 绑定的语言代码，如 "zh", "en"
}

export interface BusinessScope {
  id: string
  category: string            // 分类（可选，用于分组）
  keywords: string[]          // 关键词标签
  versions: RegionVersion[]   // 各地区版本列表
}

export interface Competitor {
  id: string
  name: string
  website: string
  is_primary: boolean
}

export interface BrandClaim {
  id: string
  statement: string
  category: string
  evidence_urls: string[]
  is_verified: boolean
}

export interface TrustedSource {
  id: string
  project_id: string
  domain: string
  tier: SourceTier
  description: string
  created_at: string
}

export interface ProjectAssets {
  tagline: string
  description: string
  website: string
  products: ProductFeature[]
  business_scopes: BusinessScope[]  // 业务范围
  competitors: Competitor[]
  brand_claims: BrandClaim[]
}

export interface ProjectSettings {
  questions_per_stage_default: number
  providers_default: AIEngine[]
  agent_concurrency: number
}

export interface Project {
  id: string
  brand_name: string
  industry: string
  language: string
  assets: ProjectAssets
  settings: ProjectSettings
  // AI 品牌总结 (从模拟结果中生成，在运行完成时更新)
  ai_summary_zh?: string
  ai_summary_en?: string
  created_at: string
  updated_at: string
}

// =============================================================================
// Persona Types
// =============================================================================

export interface PersonaGoal {
  description: string
  priority: number
}

export interface PersonaPainPoint {
  description: string
  severity: number
}

export interface Persona {
  id: string
  project_id: string
  name_zh: string
  name_en: string
  role: PersonaRole
  decision_power: string
  description: string
  goals: PersonaGoal[]
  pain_points: PersonaPainPoint[]
  tags: string[]
  color_start: string
  color_end: string
  icon_text: string
  avatar?: string  // AI 生成的头像 URL
  is_favorite: boolean
  created_at: string
}

// =============================================================================
// Benchmark & Question Types
// =============================================================================

export interface Question {
  id: string
  benchmark_id: string
  text: string
  intent: IntentType
  persona_name: string
  persona_role: PersonaRole
  keyword: string
  source: "Real_Search_Trend" | "AI_Generated"
  relevance: "relevant" | "irrelevant" | "needs_rewrite"
  is_approved: boolean
  created_at: string
}

/**
 * Benchmark生命周期状态
 * - draft: 草稿 - 问题还在编辑中
 * - generating: 正在生成问题
 * - ready: 就绪 - 可以运行模拟
 * - running: 正在运行模拟
 * - archived: 已归档
 */
export type BenchmarkStatus = "draft" | "generating" | "ready" | "running" | "archived"

export interface Benchmark {
  id: string
  project_id: string
  name: string
  scenario: BenchmarkScenario
  target_roles: PersonaRole[]
  questions_per_stage: number
  total_questions: number
  is_active: boolean
  status: BenchmarkStatus
  current_version: string
  versions_count?: number
  questions: Question[]
  created_at: string
}

// =============================================================================
// Benchmark Version Types
// =============================================================================

export type BenchmarkVersionChangeType =
  | "initial"
  | "question_added"
  | "question_modified"
  | "question_deleted"
  | "benchmark_updated"
  | "restored"

export interface BenchmarkVersionSnapshot {
  benchmark: {
    name: string
    scenario: string
    target_roles: string[]
    questions_per_stage: number
    total_questions: number
  }
  questions: Array<{
    id: string
    text: string
    intent: IntentType
    persona_name: string
    persona_role: string
    keyword: string
    source: string
    relevance: string
    is_approved: boolean
  }>
}

export interface BenchmarkVersion {
  id: string
  benchmark_id: string
  version: string
  major_version: number
  minor_version: number
  change_summary?: string
  change_type?: BenchmarkVersionChangeType
  is_current: boolean
  run_count: number
  created_at: string
}

export interface BenchmarkVersionDetail extends BenchmarkVersion {
  snapshot: BenchmarkVersionSnapshot
}

// =============================================================================
// Scenario Generation Types
// =============================================================================

export interface GenerateScenarioRequest {
  source_type: "product" | "business_scope"
  source_id: string
  region?: string
}

export interface GenerateScenarioResponse {
  scenario: string
  source_name: string
  source_description: string
}

// =============================================================================
// Simulation Result Types
// =============================================================================

export interface Citation {
  index: number
  text: string
  source_url: string
  // Extended fields from backend
  title?: string
  url?: string
  start_index?: number
  end_index?: number
}

export interface Source {
  title: string
  uri: string
  domain: string
  snippet?: string
  relevance_score?: number
}

export interface ExtractedClaim {
  id: string
  text: string
  category: string
  verdict: ClaimVerdict
  evidence?: {
    source_url: string
    snippet: string
  }
}

export interface RiskFlag {
  type: "legal_inaccuracy" | "overstatement" | "competitor_favor" | "outdated_info" | "untrusted_source"
  description: string
  severity: RiskSeverity
  text_snippet: string
}

export interface CTADetection {
  present: boolean
  target: "brand" | "competitor" | "generic" | null
  action_type: "trial" | "contact" | "website" | null
}

export interface ClaimSummary {
  supported: number
  contradicted: number
  unclear: number
}

// Competitor Analysis Types
export interface CompetitorCitationSource {
  source_title: string
  source_url: string
  reason_cited: string
  context: "positive" | "neutral" | "negative"
}

export interface CompetitorDetail {
  name: string
  citation_sources: CompetitorCitationSource[]
  mention_context: string
  strength_areas: string[]
}

export interface ContentGapTopic {
  topic: string
  importance: "high" | "medium" | "low"
  reason: string
}

export interface ContentGapSource {
  source_type: string
  example: string
  impact: string
}

export interface PositioningGap {
  gap: string
  competitor_advantage: string
  recommendation: string
}

export interface ContentGaps {
  missing_topics: ContentGapTopic[]
  missing_sources: ContentGapSource[]
  positioning_gaps: PositioningGap[]
}

export interface RecommendationItem {
  action: string
  rationale: string
  effort: "low" | "medium" | "high"
  estimated_impact?: string
}

export interface QuickWin {
  action: string
  implementation: string
}

export interface Recommendations {
  high_priority: RecommendationItem[]
  medium_priority: RecommendationItem[]
  quick_wins: QuickWin[]
}

export interface CompetitorAnalysis {
  competitor_details: CompetitorDetail[]
  content_gaps: ContentGaps
  recommendations: Recommendations
  executive_summary: string
  analyzed_at?: string
}

// Product mention detection result (品牌+产品关联检测)
export interface ProductMentionResult {
  product_name: string
  language: string              // 检测到的语言版本
  is_brand_associated: boolean  // 是否与品牌在同一上下文
  context_snippet: string       // 上下文片段
  sentiment: "positive" | "neutral" | "negative"
}

export interface SimulationResult {
  id: string
  run_item_id: string
  run_id: string
  question_id: string
  engine: AIEngine
  channel: SimulationChannel
  raw_response: string
  simulated_response: string
  citations: Citation[]
  sources: Source[]
  search_candidates?: Source[]  // Raw search candidates from API
  brand_mentioned: boolean
  competitor_mentioned: boolean
  competitors_mentioned: string[]  // List of competitor names mentioned in the response
  visibility_score: number
  ranking: number | null
  sentiment: "positive" | "neutral" | "negative"
  claims: ExtractedClaim[]
  claim_summary: ClaimSummary
  compliance_risk_score: number
  risk_flags: RiskFlag[]
  cta: CTADetection
  positioning_hits: string[]
  competitor_analysis?: CompetitorAnalysis | null  // AI-powered competitive gap analysis
  // 产品关联检测 (品牌+产品上下文关联)
  products_mentioned?: ProductMentionResult[]
  has_brand_product_linkage?: boolean  // 是否有品牌+产品关联提及
  created_at: string
}

// =============================================================================
// Run Types
// =============================================================================

export interface RunItem {
  id: string
  run_id: string
  question_id: string
  engine: AIEngine
  channel: SimulationChannel
  status: RunStatus
  error_message?: string
  retry_count: number
  started_at?: string
  completed_at?: string
}

export interface RunSummary {
  visibility_rate: number
  avg_ranking: number
  top3_rate: number
  claim_support_rate: number
  claim_contradiction_rate: number
  high_risk_count: number
  compliance_score: number
  cta_capture_rate: number
  competitor_cta_rate: number
  by_engine: Record<AIEngine, {
    visibility_rate: number
    avg_ranking: number
    result_count: number
  }>
  // Unified metrics for cards and detail views
  total_results: number       // Total number of results (denominator)
  danger_count: number        // Competitor mentioned but brand not mentioned
  needs_optimization_count: number  // Not mentioned or ranking > 3
}

export interface Run {
  id: string
  project_id: string
  benchmark_id: string
  benchmark_version?: string        // 运行时的 Benchmark 版本号
  benchmark_version_id?: string     // 版本记录 ID
  engines: AIEngine[]
  channels: SimulationChannel[]
  sample_strategy: "all" | "random"
  sample_size?: number
  status: RunStatus
  progress: {
    total: number
    completed: number
    failed: number
  }
  summary?: RunSummary
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface RunWithResults extends Run {
  results: SimulationResult[]
  results_total: number
}

// =============================================================================
// Metrics Types (P0)
// =============================================================================

export interface Metrics {
  // P0 核心指标
  visibility_rate: number           // 品牌曝光率
  total_simulations: number         // 总模拟次数
  needs_optimization_count: number  // 待优化查询数 (X)
  total_questions: number           // 总问题数 (N)
  avg_ranking: number | null        // 平均有效排名（仅计算被提及且有排名的结果，无数据时为 null）

  // 趋势变化 (与上一次记录对比)
  avg_ranking_trend?: number        // 排名变化 (正数表示下降/变差，负数表示上升/变好)
  visibility_rate_trend?: number    // 曝光率变化 (正数表示上升，负数表示下降)

  // 辅助指标
  top_position_rate: number
  avg_visibility_score: number
  brand_mentioned_count: number

  // P1 指标 (暂不展示)
  // claim_support_rate: number
  // high_risk_count: number
}

// =============================================================================
// Optimization Types (P0 六大旅程分类)
// =============================================================================

export type JourneyType = "AWARE" | "RECOMMEND" | "CHOOSE" | "COMPETE" | "TRUST" | "CONTACT"

export interface OptimizationIssue {
  id: string
  result_id: string    // SimulationResult ID for navigation
  run_id: string       // Run ID for workspace navigation
  question_id: string
  question_text: string
  journey: JourneyType
  reason: "not_mentioned" | "ranking_low" | "competitor_favored"
  engine: AIEngine
  ranking?: number | null
  brand_mentioned: boolean
  // Persona info for display
  persona_name?: string
  persona_role?: PersonaRole
  persona_avatar?: string
}

export interface JourneyOptimization {
  journey: JourneyType
  journey_name_zh: string
  journey_name_en: string
  icon: string
  issue_count: number
  issues: OptimizationIssue[]
}

// =============================================================================
// System & App Info Types
// =============================================================================

export interface AppInfo {
  name: string
  version: string
  build_date: string
  tagline_zh: string
  tagline_en: string
  logo_url: string
  github_url: string
  docs_url: string
}

export type ChangelogType = "feature" | "improve" | "fix" | "breaking" | "security" | "deprecated"

export interface ChangelogAuthor {
  username: string
  name: string
  avatar_url: string | null
  github_url: string | null
}

export interface ChangelogEntry {
  type: ChangelogType
  title_zh: string
  title_en: string
  detail_zh?: string
  detail_en?: string
  commit_hash?: string | null
  issue_url?: string | null
  pr_url?: string | null
  author?: ChangelogAuthor | null  // 每个条目的作者
}

export interface ChangelogItem {
  type: ChangelogType
  text_zh: string
  text_en: string
}

export interface ChangelogRelease {
  version: string
  date: string
  changes: ChangelogItem[]
  author?: ChangelogAuthor | null
  entries?: ChangelogEntry[]
}

export interface Changelog {
  releases: ChangelogRelease[]
}

// =============================================================================
// Dashboard Types (仪表盘数据)
// =============================================================================

export interface IndustryRanking {
  rank: number
  brand: string
  visibility: number
  isHighlighted: boolean
}

export interface VisibilityTrendPoint {
  date: string
  [brand: string]: string | number  // 动态品牌键值
}

export interface BrandLine {
  key: string
  name: string
  color: string
}

export interface DashboardData {
  industryRankings: IndustryRanking[]
  visibilityTrends: VisibilityTrendPoint[]
  brandLines: BrandLine[]
  aiSummary: {
    zh: string
    en: string
  }
}
