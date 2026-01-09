/**
 * GEO-SCOPE Default Data
 * Mock data for e签宝 (e-Sign) as target customer
 * Used when API is unavailable or for demo purposes
 */

import type {
  User,
  Project,
  Persona,
  Benchmark,
  TrustedSource,
  Run,
  SimulationResult,
  Metrics,
} from './types'

// =============================================================================
// Default User (e签宝 管理员)
// =============================================================================

export const DEFAULT_USER: User = {
  id: "user-esign-admin",
  email: "admin@esign.cn",
  name: "管理员",
  avatar: "",
  company_name: "e签宝",
  role: "admin",
  created_at: new Date().toISOString(),
}

// =============================================================================
// e签宝 Default Project
// =============================================================================

export const DEFAULT_PROJECT: Project = {
  id: "default-esign",
  brand_name: "e签宝",
  industry: "电子合约",
  language: "zh",
  assets: {
    tagline: "让签署更简单",
    description: "e签宝是中国领先的电子签名与智能合同平台，为企业提供合规、安全、高效的电子签约服务。",
    website: "https://www.esign.cn",
    products: [
      { id: "p1", versions: [
        { region: "中国大陆", name: "电子签名", description: "符合《电子签名法》的合规电子签名服务", language: "zh" },
        { region: "Singapore", name: "E-Signature", description: "Compliant e-signature service", language: "en" },
        { region: "日本", name: "電子署名", description: "電子署名法に準拠した電子署名サービス", language: "ja" },
      ]},
      { id: "p2", versions: [
        { region: "中国大陆", name: "智能合同", description: "AI驱动的合同起草、审核与管理", language: "zh" },
        { region: "Singapore", name: "Smart Contract", description: "AI-powered contract drafting and management", language: "en" },
      ]},
      { id: "p3", versions: [
        { region: "中国大陆", name: "司法存证", description: "区块链存证，司法采信率100%", language: "zh" },
        { region: "Singapore", name: "Judicial Evidence", description: "Blockchain-based evidence preservation", language: "en" },
      ]},
      { id: "p4", versions: [
        { region: "中国大陆", name: "印章管理", description: "企业电子印章全生命周期管理", language: "zh" },
        { region: "Singapore", name: "Seal Management", description: "Enterprise electronic seal lifecycle management", language: "en" },
      ]},
      { id: "p5", versions: [
        { region: "中国大陆", name: "API集成", description: "丰富的API接口，快速对接OA/ERP", language: "zh" },
        { region: "全球", name: "API Integration", description: "Rich API interfaces for quick integration", language: "en" },
      ]},
      { id: "p6", versions: [
        { region: "中国大陆", name: "私有化部署", description: "支持本地化部署，数据完全自主可控", language: "zh" },
        { region: "全球", name: "On-Premise Deployment", description: "Support local deployment with full data control", language: "en" },
      ]},
    ],
    competitors: [
      { id: "c1", name: "法大大", website: "https://www.fadada.com", is_primary: true },
      { id: "c2", name: "上上签", website: "https://www.bestsign.cn", is_primary: true },
      { id: "c3", name: "契约锁", website: "https://www.qiyuesuo.com", is_primary: false },
      { id: "c4", name: "众签", website: "https://www.zhongsign.com", is_primary: false },
    ],
    brand_claims: [
      { id: "bc1", statement: "电子签名具有法律效力", category: "legal", evidence_urls: ["https://www.esign.cn/legal"], is_verified: true },
      { id: "bc2", statement: "司法采信率100%", category: "legal", evidence_urls: ["https://www.esign.cn/case"], is_verified: true },
      { id: "bc3", statement: "支持私有化部署", category: "security", evidence_urls: ["https://www.esign.cn/deploy"], is_verified: true },
      { id: "bc4", statement: "API响应时间<100ms", category: "tech", evidence_urls: ["https://www.esign.cn/api"], is_verified: true },
    ],
    business_scopes: [
      {
        id: "bs1",
        category: "B2B服务",
        keywords: ["电子合同", "企业签署"],
        versions: [
          { region: "中国大陆", product_name: "企业电子合同服务", description: "面向中国大陆企业的电子合同签署与管理服务，服务100+世界500强", language: "zh" },
        ]
      },
      {
        id: "bs2",
        category: "跨境服务",
        keywords: ["东南亚", "跨境", "扫码签约"],
        versions: [
          { region: "新加坡", product_name: "Southeast Asia E-Sign", description: "Cross-border e-signature service for Southeast Asia with data center in Singapore", language: "en" },
          { region: "马来西亚", product_name: "Southeast Asia E-Sign", description: "Cross-border e-signature service for Malaysia", language: "en" },
          { region: "泰国", product_name: "Southeast Asia E-Sign", description: "Cross-border e-signature service for Thailand", language: "en" },
        ]
      },
      {
        id: "bs3",
        category: "全球服务",
        keywords: ["跨境", "全球", "出海"],
        versions: [
          { region: "全球", product_name: "eSign Global", description: "Cross-border e-signature platform covering 63+ countries and regions", language: "en" },
          { region: "中国大陆", product_name: "e签宝国际版", description: "覆盖63+国家和地区的跨境电子签署平台，已服务3000+出海中资企业", language: "zh" },
        ]
      },
    ],
  },
  settings: {
    questions_per_stage_default: 6,
    providers_default: ["chatgpt", "deepseek", "claude", "doubao"],
    agent_concurrency: 4,
  },
  ai_summary_zh: "基于 6 次 AI 平台模拟分析，e签宝在电子合约行业的综合曝光率达到 100%，位列行业第一。品牌在 AI 回答中的正面情感占比为 100%，Top3 推荐率为 100%。表现优异，建议持续监测竞品动态。",
  ai_summary_en: "Based on 6 AI platform simulations, e签宝 achieves a 100% visibility rate in the electronic contract sector, ranking #1. The brand has 100% positive sentiment and 100% top-3 recommendation rate. Excellent performance, recommend continuous competitor monitoring.",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// =============================================================================
// e签宝 Default Personas
// =============================================================================

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: "persona-legal",
    project_id: "default-esign",
    name_zh: "法务负责人",
    name_en: "Legal Director",
    role: "legal",
    decision_power: "决策者",
    description: "负责企业法律事务，关注电子签名的法律效力和合规风险",
    goals: [
      { description: "确保电子签名符合《电子签名法》", priority: 1 },
      { description: "保障合同的司法可采信性", priority: 2 },
      { description: "降低合同纠纷风险", priority: 3 },
    ],
    pain_points: [
      { description: "担心电子签名法律效力不足", severity: 5 },
      { description: "司法存证的可靠性存疑", severity: 4 },
      { description: "合规审计难度大", severity: 3 },
    ],
    tags: ["法务", "合规", "风控"],
    color_start: "#6366f1",
    color_end: "#8b5cf6",
    icon_text: "法",
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "persona-it",
    project_id: "default-esign",
    name_zh: "IT架构师",
    name_en: "IT Architect",
    role: "it",
    decision_power: "影响者",
    description: "负责企业系统架构，关注API集成和技术对接",
    goals: [
      { description: "快速完成系统集成", priority: 1 },
      { description: "确保系统稳定性和安全性", priority: 2 },
      { description: "降低技术维护成本", priority: 3 },
    ],
    pain_points: [
      { description: "API文档不完善", severity: 4 },
      { description: "集成对接周期长", severity: 4 },
      { description: "技术支持响应慢", severity: 3 },
    ],
    tags: ["技术", "集成", "架构"],
    color_start: "#10b981",
    color_end: "#14b8a6",
    icon_text: "技",
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "persona-business",
    project_id: "default-esign",
    name_zh: "业务负责人",
    name_en: "Business Director",
    role: "business",
    decision_power: "使用者",
    description: "负责业务流程，关注签署效率和用户体验",
    goals: [
      { description: "提升合同签署效率", priority: 1 },
      { description: "改善客户签约体验", priority: 2 },
      { description: "减少纸质合同成本", priority: 3 },
    ],
    pain_points: [
      { description: "签署流程繁琐", severity: 4 },
      { description: "客户操作不便", severity: 3 },
      { description: "批量签署效率低", severity: 3 },
    ],
    tags: ["业务", "效率", "体验"],
    color_start: "#f59e0b",
    color_end: "#f97316",
    icon_text: "业",
    is_favorite: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "persona-security",
    project_id: "default-esign",
    name_zh: "信息安全官",
    name_en: "CISO",
    role: "security",
    decision_power: "守门人",
    description: "负责信息安全，关注数据保护和安全合规",
    goals: [
      { description: "确保数据安全合规", priority: 1 },
      { description: "通过等保测评", priority: 2 },
      { description: "防范安全风险", priority: 3 },
    ],
    pain_points: [
      { description: "数据安全存疑", severity: 5 },
      { description: "等保合规压力大", severity: 4 },
      { description: "安全审计复杂", severity: 3 },
    ],
    tags: ["安全", "合规", "审计"],
    color_start: "#ef4444",
    color_end: "#f43f5e",
    icon_text: "安",
    is_favorite: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "persona-procurement",
    project_id: "default-esign",
    name_zh: "采购经理",
    name_en: "Procurement Manager",
    role: "procurement",
    decision_power: "影响者",
    description: "负责供应商采购，关注价格和服务条款",
    goals: [
      { description: "控制采购成本", priority: 1 },
      { description: "确保服务条款合理", priority: 2 },
      { description: "保障供应商稳定性", priority: 3 },
    ],
    pain_points: [
      { description: "价格不透明", severity: 4 },
      { description: "合同条款复杂", severity: 3 },
      { description: "供应商选择困难", severity: 3 },
    ],
    tags: ["采购", "成本", "供应商"],
    color_start: "#3b82f6",
    color_end: "#6366f1",
    icon_text: "采",
    is_favorite: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "persona-executive",
    project_id: "default-esign",
    name_zh: "企业高管",
    name_en: "Executive",
    role: "executive",
    decision_power: "决策者",
    description: "企业决策层，关注ROI和战略价值",
    goals: [
      { description: "提升企业运营效率", priority: 1 },
      { description: "控制运营成本", priority: 2 },
      { description: "数字化转型", priority: 3 },
    ],
    pain_points: [
      { description: "投资回报不明确", severity: 4 },
      { description: "替换成本高", severity: 4 },
      { description: "决策依据不足", severity: 3 },
    ],
    tags: ["决策", "战略", "ROI"],
    color_start: "#8b5cf6",
    color_end: "#a855f7",
    icon_text: "总",
    is_favorite: true,
    created_at: new Date().toISOString(),
  },
]

// =============================================================================
// e签宝 Default Benchmarks
// =============================================================================

export const DEFAULT_BENCHMARKS: Benchmark[] = [
  {
    id: "bm-legal",
    project_id: "default-esign",
    name: "法律效力测试套件",
    scenario: "legal_validity",
    target_roles: ["legal", "security"],
    questions_per_stage: 6,
    total_questions: 18,
    is_active: true,
    status: "ready",
    current_version: "1.0",
    questions: [
      { id: "q1", benchmark_id: "bm-legal", text: "电子合同有法律效力吗？", intent: "AWARE", persona_role: "legal", keyword: "法律效力", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
      { id: "q2", benchmark_id: "bm-legal", text: "电子签名符合哪些法律法规？", intent: "AWARE", persona_role: "legal", keyword: "法规", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
      { id: "q3", benchmark_id: "bm-legal", text: "哪家电子签名服务商最合规？", intent: "RECOMMEND", persona_role: "legal", keyword: "合规", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
      { id: "q4", benchmark_id: "bm-legal", text: "e签宝的电子签名合法吗？", intent: "TRUST", persona_role: "legal", keyword: "e签宝", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
      { id: "q5", benchmark_id: "bm-legal", text: "e签宝和法大大哪个更合规？", intent: "COMPETE", persona_role: "legal", keyword: "对比", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
      { id: "q6", benchmark_id: "bm-legal", text: "e签宝的司法存证能被法院采信吗？", intent: "TRUST", persona_role: "security", keyword: "司法存证", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "bm-integration",
    project_id: "default-esign",
    name: "API集成测试套件",
    scenario: "api_integration",
    target_roles: ["it"],
    questions_per_stage: 6,
    total_questions: 12,
    is_active: false,
    status: "ready",
    current_version: "1.0",
    questions: [
      { id: "q7", benchmark_id: "bm-integration", text: "电子签名API有哪些主流方案？", intent: "AWARE", persona_role: "it", keyword: "API", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
      { id: "q8", benchmark_id: "bm-integration", text: "哪家电子签名API文档最完善？", intent: "RECOMMEND", persona_role: "it", keyword: "API文档", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
      { id: "q9", benchmark_id: "bm-integration", text: "e签宝API稳定性怎么样？", intent: "TRUST", persona_role: "it", keyword: "稳定性", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
      { id: "q10", benchmark_id: "bm-integration", text: "e签宝能对接SAP吗？", intent: "CHOOSE", persona_role: "it", keyword: "SAP集成", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: "bm-compete",
    project_id: "default-esign",
    name: "竞品对比测试套件",
    scenario: "competitor_compare",
    target_roles: ["procurement", "executive"],
    questions_per_stage: 6,
    total_questions: 12,
    is_active: false,
    status: "ready",
    current_version: "1.0",
    questions: [
      { id: "q11", benchmark_id: "bm-compete", text: "电子签名市场份额排名", intent: "AWARE", persona_role: "executive", keyword: "市场份额", source: "Real_Search_Trend", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
      { id: "q12", benchmark_id: "bm-compete", text: "e签宝和上上签价格对比", intent: "COMPETE", persona_role: "procurement", keyword: "价格", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
      { id: "q13", benchmark_id: "bm-compete", text: "e签宝批量签署功能好用吗？", intent: "TRUST", persona_role: "business", keyword: "批量签", source: "AI_Generated", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
      { id: "q14", benchmark_id: "bm-compete", text: "企业电子签名哪家性价比高？", intent: "RECOMMEND", persona_role: "procurement", keyword: "性价比", source: "Real_Search_Trend", relevance: "relevant", is_approved: true, created_at: new Date().toISOString() },
    ],
    created_at: new Date().toISOString(),
  },
]

// =============================================================================
// e签宝 Default Trusted Sources
// =============================================================================

export const DEFAULT_TRUSTED_SOURCES: TrustedSource[] = [
  { id: "ts1", project_id: "default-esign", domain: "esign.cn", tier: "official", description: "e签宝官网", created_at: new Date().toISOString() },
  { id: "ts2", project_id: "default-esign", domain: "gov.cn", tier: "authority", description: "政府官网", created_at: new Date().toISOString() },
  { id: "ts3", project_id: "default-esign", domain: "court.gov.cn", tier: "authority", description: "法院官网", created_at: new Date().toISOString() },
  { id: "ts4", project_id: "default-esign", domain: "miit.gov.cn", tier: "authority", description: "工信部官网", created_at: new Date().toISOString() },
  { id: "ts5", project_id: "default-esign", domain: "36kr.com", tier: "media", description: "36氪科技媒体", created_at: new Date().toISOString() },
  { id: "ts6", project_id: "default-esign", domain: "zhihu.com", tier: "media", description: "知乎问答", created_at: new Date().toISOString() },
]

// =============================================================================
// e签宝 Default Runs (模拟运行记录)
// =============================================================================

export const DEFAULT_RUNS: Run[] = [
  {
    id: "run-demo-1",
    project_id: "default-esign",
    benchmark_id: "bm-legal",
    engines: ["chatgpt", "deepseek", "claude", "doubao"],
    channels: ["search"],
    sample_strategy: "all",
    status: "completed",
    progress: {
      total: 6,
      completed: 6,
      failed: 0,
    },
    summary: {
      visibility_rate: 1.0,
      avg_ranking: 1.0,
      top3_rate: 1.0,
      claim_support_rate: 0.85,
      claim_contradiction_rate: 0.0,
      high_risk_count: 0,
      compliance_score: 90,
      cta_capture_rate: 0.67,
      competitor_cta_rate: 0.0,
      by_engine: {
        chatgpt: { visibility_rate: 1.0, avg_ranking: 1.0, result_count: 2 },
        deepseek: { visibility_rate: 1.0, avg_ranking: 1.0, result_count: 2 },
        claude: { visibility_rate: 1.0, avg_ranking: 1.0, result_count: 1 },
        doubao: { visibility_rate: 1.0, avg_ranking: 1.0, result_count: 1 },
      },
      // Unified metrics
      total_results: 6,
      danger_count: 0,
      needs_optimization_count: 0,
    },
    started_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date(Date.now() - 3000000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

// =============================================================================
// e签宝 Default Simulation Results (模拟结果数据)
// =============================================================================

export const DEFAULT_SIMULATION_RESULTS: SimulationResult[] = [
  {
    id: "result-1",
    run_item_id: "item-1",
    run_id: "run-demo-1",
    question_id: "q1",
    engine: "chatgpt",
    channel: "search",
    raw_response: "",
    simulated_response: `电子合同是具有法律效力的。根据《中华人民共和国电子签名法》第十四条规定，可靠的电子签名与手写签名或者盖章具有同等的法律效力。

e签宝作为国内领先的电子签名服务商，其电子合同服务完全符合《电子签名法》的要求，主要体现在：

1. **身份认证**：采用实名认证技术，确保签署人身份真实可靠
2. **签名安全**：使用数字证书技术，保证签名的唯一性和不可篡改性
3. **存证服务**：与多家权威司法机构合作，提供区块链存证服务
4. **时间戳**：引入可信时间戳，确保签署时间的准确性

建议您在选择电子签名服务时，关注服务商的资质认证和司法采信案例。`,
    citations: [
      { index: 1, text: "《电子签名法》第十四条：可靠的电子签名与手写签名或者盖章具有同等的法律效力", source_url: "https://www.gov.cn/flfg/2004-08/28/content_7772.htm" },
      { index: 2, text: "e签宝获得国家电子合同备案资质", source_url: "https://www.esign.cn/about" },
    ],
    sources: [
      { title: "中华人民共和国电子签名法", uri: "https://www.gov.cn/flfg/2004-08/28/content_7772.htm", domain: "gov.cn" },
      { title: "e签宝官网 - 关于我们", uri: "https://www.esign.cn/about", domain: "esign.cn" },
      { title: "电子合同法律效力解读", uri: "https://www.court.gov.cn/article/detail/2020/12/id/5673682.html", domain: "court.gov.cn" },
    ],
    brand_mentioned: true,
    competitor_mentioned: false,
    competitors_mentioned: [],
    visibility_score: 85,
    ranking: 1,
    sentiment: "positive",
    claims: [
      { id: "claim-1", text: "e签宝电子合同符合《电子签名法》", category: "legal", verdict: "supported", evidence: { source_url: "https://www.esign.cn/legal", snippet: "e签宝电子签名服务通过国家密码管理局认证" } },
      { id: "claim-2", text: "提供区块链存证服务", category: "tech", verdict: "supported", evidence: { source_url: "https://www.esign.cn/blockchain", snippet: "与蚂蚁链合作提供司法存证" } },
    ],
    claim_summary: { supported: 2, contradicted: 0, unclear: 0 },
    compliance_risk_score: 0.1,
    risk_flags: [],
    cta: { present: true, target: "brand", action_type: "website" },
    positioning_hits: ["电子签名", "法律效力", "司法存证"],
    created_at: new Date().toISOString(),
  },
  {
    id: "result-2",
    run_item_id: "item-2",
    run_id: "run-demo-1",
    question_id: "q3",
    engine: "deepseek",
    channel: "search",
    raw_response: "",
    simulated_response: `在国内电子签名服务商中，合规性方面表现突出的有以下几家：

1. **e签宝** - 国内较早获得电子签名资质的企业，与多家CA机构合作，提供完整的司法存证链路
2. **法大大** - 专注于企业级电子合同服务，获得多项安全认证
3. **上上签** - 在金融行业有较多应用案例

从合规角度来看，选择电子签名服务商时建议关注：
- 是否具备电子签名相关资质
- 是否与CA认证机构合作
- 是否提供司法存证服务
- 是否有法院采信的案例支持

e签宝在以上几个维度都表现出色，特别是在司法采信方面积累了大量成功案例。`,
    citations: [
      { index: 1, text: "e签宝司法采信案例超过100+", source_url: "https://www.esign.cn/case" },
    ],
    sources: [
      { title: "e签宝案例中心", uri: "https://www.esign.cn/case", domain: "esign.cn" },
      { title: "电子签名市场分析报告", uri: "https://www.36kr.com/p/1234567", domain: "36kr.com" },
    ],
    brand_mentioned: true,
    competitor_mentioned: true,
    competitors_mentioned: ["法大大", "上上签"],
    visibility_score: 72,
    ranking: 1,
    sentiment: "positive",
    claims: [
      { id: "claim-3", text: "e签宝是国内较早获得资质的企业", category: "business", verdict: "supported" },
    ],
    claim_summary: { supported: 1, contradicted: 0, unclear: 0 },
    compliance_risk_score: 0.15,
    risk_flags: [],
    cta: { present: false, target: null, action_type: null },
    positioning_hits: ["电子签名", "合规", "司法存证"],
    created_at: new Date().toISOString(),
  },
  {
    id: "result-3",
    run_item_id: "item-3",
    run_id: "run-demo-1",
    question_id: "q5",
    engine: "claude",
    channel: "search",
    raw_response: "",
    simulated_response: `e签宝和法大大是国内电子签名领域的两大主要服务商，两者在合规性方面各有特点：

**e签宝的合规优势：**
- 较早进入市场，积累了丰富的司法采信案例
- 与蚂蚁集团合作的区块链存证能力
- 覆盖全行业的合规解决方案

**法大大的合规优势：**
- 专注于企业级服务
- 获得多项国际安全认证
- 在金融合规领域有深耕

从整体合规性来看，两家各有侧重。e签宝在司法存证和区块链技术应用方面更具优势，而法大大在企业服务标准化方面做得比较完善。

建议您根据具体业务场景选择合适的服务商，如果对司法存证有较高要求，e签宝可能是更好的选择。`,
    citations: [],
    sources: [
      { title: "e签宝 vs 法大大对比分析", uri: "https://www.zhihu.com/question/123456", domain: "zhihu.com" },
    ],
    brand_mentioned: true,
    competitor_mentioned: true,
    competitors_mentioned: ["法大大"],
    visibility_score: 68,
    ranking: 1,
    sentiment: "positive",
    claims: [
      { id: "claim-4", text: "e签宝与蚂蚁集团合作区块链存证", category: "tech", verdict: "supported" },
      { id: "claim-5", text: "e签宝在司法存证方面更具优势", category: "legal", verdict: "supported" },
    ],
    claim_summary: { supported: 2, contradicted: 0, unclear: 0 },
    compliance_risk_score: 0.2,
    risk_flags: [],
    cta: { present: true, target: "brand", action_type: "trial" },
    positioning_hits: ["司法存证", "区块链", "合规"],
    created_at: new Date().toISOString(),
  },
  {
    id: "result-4",
    run_item_id: "item-4",
    run_id: "run-demo-1",
    question_id: "q4",
    engine: "doubao",
    channel: "search",
    raw_response: "",
    simulated_response: `e签宝的电子签名是合法有效的。作为国内领先的电子签名平台，e签宝的服务完全符合《电子签名法》的要求。

e签宝的合法性体现在以下几个方面：

1. **资质认证**：e签宝已获得国家相关部门的电子签名服务资质认证
2. **技术保障**：采用符合国家标准的数字证书和加密技术
3. **司法认可**：与多家法院、仲裁机构建立了存证对接，电子合同已在多起诉讼中被法院采信
4. **行业标准**：参与多项电子签名行业标准的制定

如果您担心法律效力问题，建议选择e签宝这样有资质、有案例积累的正规平台。`,
    citations: [
      { index: 1, text: "e签宝获得电子签名服务资质", source_url: "https://www.esign.cn/qualification" },
    ],
    sources: [
      { title: "e签宝资质认证", uri: "https://www.esign.cn/qualification", domain: "esign.cn" },
    ],
    brand_mentioned: true,
    competitor_mentioned: false,
    competitors_mentioned: [],
    visibility_score: 78,
    ranking: 1,
    sentiment: "positive",
    claims: [
      { id: "claim-6", text: "e签宝已获得电子签名服务资质认证", category: "legal", verdict: "supported" },
      { id: "claim-7", text: "电子合同已在多起诉讼中被法院采信", category: "legal", verdict: "supported" },
    ],
    claim_summary: { supported: 2, contradicted: 0, unclear: 0 },
    compliance_risk_score: 0.1,
    risk_flags: [],
    cta: { present: true, target: "brand", action_type: "website" },
    positioning_hits: ["电子签名", "法律效力", "司法采信"],
    created_at: new Date().toISOString(),
  },
  {
    id: "result-5",
    run_item_id: "item-5",
    run_id: "run-demo-1",
    question_id: "q6",
    engine: "chatgpt",
    channel: "search",
    raw_response: "",
    simulated_response: `e签宝的司法存证服务是可以被法院采信的，这得益于其完整的存证体系：

**技术保障：**
- 与蚂蚁链合作，采用区块链技术确保数据不可篡改
- 接入国家授时中心，提供可信时间戳
- 采用国密算法进行数据加密

**司法对接：**
- 与全国多家互联网法院、仲裁机构建立了存证对接
- 已有大量案例通过e签宝存证被法院采信
- 支持一键出证，直接调取证据

**合规认证：**
- 通过等保三级认证
- 获得ISO27001信息安全管理体系认证

需要注意的是，司法存证的采信还需要结合具体案件情况，但e签宝的存证体系已经得到了司法实践的验证。`,
    citations: [
      { index: 1, text: "e签宝区块链存证技术获得司法认可", source_url: "https://www.esign.cn/blockchain" },
      { index: 2, text: "互联网法院电子证据规则", source_url: "https://www.court.gov.cn/evidence" },
    ],
    sources: [
      { title: "e签宝区块链存证", uri: "https://www.esign.cn/blockchain", domain: "esign.cn" },
      { title: "互联网法院电子证据指引", uri: "https://www.court.gov.cn/evidence", domain: "court.gov.cn" },
    ],
    brand_mentioned: true,
    competitor_mentioned: false,
    competitors_mentioned: [],
    visibility_score: 82,
    ranking: 1,
    sentiment: "positive",
    claims: [
      { id: "claim-8", text: "与蚂蚁链合作提供区块链存证", category: "tech", verdict: "supported" },
      { id: "claim-9", text: "与互联网法院建立存证对接", category: "legal", verdict: "supported" },
      { id: "claim-10", text: "通过等保三级认证", category: "security", verdict: "supported" },
    ],
    claim_summary: { supported: 3, contradicted: 0, unclear: 0 },
    compliance_risk_score: 0.08,
    risk_flags: [],
    cta: { present: true, target: "brand", action_type: "contact" },
    positioning_hits: ["区块链", "司法存证", "法院采信", "等保三级"],
    created_at: new Date().toISOString(),
  },
  {
    id: "result-6",
    run_item_id: "item-6",
    run_id: "run-demo-1",
    question_id: "q7",
    engine: "deepseek",
    channel: "search",
    raw_response: "",
    simulated_response: `目前国内主流的电子签名API方案主要有以下几种：

1. **e签宝开放平台**
   - 提供完整的API/SDK，支持多种开发语言
   - 文档完善，有完整的接入指南
   - 支持签署、认证、存证等全流程

2. **法大大API**
   - 专注企业级服务
   - 支持私有化部署

3. **上上签API**
   - 金融行业应用较多
   - 提供标准化接口

从API文档完善程度来看，e签宝开放平台的文档最为详尽，提供了详细的接口说明、示例代码和常见问题解答。其SDK支持Java、Python、PHP、Node.js等多种语言。

建议在选择时关注：
- 接口文档的完整性
- SDK支持的语言种类
- 技术支持响应速度
- 调用量和稳定性`,
    citations: [],
    sources: [
      { title: "e签宝开放平台", uri: "https://open.esign.cn", domain: "open.esign.cn" },
    ],
    brand_mentioned: true,
    competitor_mentioned: true,
    competitors_mentioned: ["法大大", "上上签"],
    visibility_score: 70,
    ranking: 1,
    sentiment: "positive",
    claims: [
      { id: "claim-11", text: "e签宝开放平台文档完善", category: "tech", verdict: "supported" },
    ],
    claim_summary: { supported: 1, contradicted: 0, unclear: 0 },
    compliance_risk_score: 0.12,
    risk_flags: [],
    cta: { present: false, target: null, action_type: null },
    positioning_hits: ["API", "SDK", "开放平台"],
    created_at: new Date().toISOString(),
  },
]

// =============================================================================
// e签宝 Default Metrics (仪表盘指标 - P0)
// =============================================================================

export const DEFAULT_METRICS: Metrics = {
  // P0 核心指标
  visibility_rate: 0,
  total_simulations: 0,
  needs_optimization_count: 0,
  total_questions: 0,
  avg_ranking: null,

  // 辅助指标
  top_position_rate: 0,
  avg_visibility_score: 0,
  brand_mentioned_count: 0,
}

// =============================================================================
// e签宝 Default Journey Optimizations (六大旅程优化建议 - P0)
// =============================================================================

import type { JourneyOptimization } from './types'

export const DEFAULT_JOURNEY_OPTIMIZATIONS: JourneyOptimization[] = [
  {
    journey: "AWARE",
    journey_name_zh: "认知优化",
    journey_name_en: "Awareness",
    icon: "Search",
    issue_count: 3,
    issues: [
      { id: "opt-1", result_id: "r1", run_id: "run-1", question_id: "q1", question_text: "电子合同有法律效力吗？", journey: "AWARE", reason: "ranking_low", engine: "deepseek", ranking: 4, brand_mentioned: true, persona_name: "王法务", persona_role: "legal", persona_avatar: "" },
      { id: "opt-2", result_id: "r2", run_id: "run-1", question_id: "q2", question_text: "企业签署电子合同需要什么条件？", journey: "AWARE", reason: "not_mentioned", engine: "doubao", ranking: null, brand_mentioned: false, persona_name: "李经理", persona_role: "business", persona_avatar: "" },
      { id: "opt-3", result_id: "r3", run_id: "run-1", question_id: "q3", question_text: "电子签名的应用场景有哪些？", journey: "AWARE", reason: "ranking_low", engine: "claude", ranking: 5, brand_mentioned: true, persona_name: "张工程师", persona_role: "it", persona_avatar: "" },
    ],
  },
  {
    journey: "RECOMMEND",
    journey_name_zh: "推荐优化",
    journey_name_en: "Recommendation",
    icon: "Megaphone",
    issue_count: 2,
    issues: [
      { id: "opt-4", result_id: "r4", run_id: "run-1", question_id: "q4", question_text: "推荐好用的电子签名平台？", journey: "RECOMMEND", reason: "competitor_favored", engine: "chatgpt", ranking: 2, brand_mentioned: true, persona_name: "王法务", persona_role: "legal", persona_avatar: "" },
      { id: "opt-5", result_id: "r5", run_id: "run-1", question_id: "q5", question_text: "哪家电子签名服务商性价比高？", journey: "RECOMMEND", reason: "ranking_low", engine: "deepseek", ranking: 4, brand_mentioned: true, persona_name: "陈采购", persona_role: "procurement", persona_avatar: "" },
    ],
  },
  {
    journey: "CHOOSE",
    journey_name_zh: "优选优化",
    journey_name_en: "Selection",
    icon: "Trophy",
    issue_count: 4,
    issues: [
      { id: "opt-6", result_id: "r6", run_id: "run-1", question_id: "q11", question_text: "电子签名市场份额排名？", journey: "CHOOSE", reason: "ranking_low", engine: "chatgpt", ranking: 5, brand_mentioned: true, persona_name: "刘总监", persona_role: "executive", persona_avatar: "" },
      { id: "opt-7", result_id: "r7", run_id: "run-1", question_id: "q12", question_text: "国内电子签名头部企业有哪些？", journey: "CHOOSE", reason: "competitor_favored", engine: "claude", ranking: 3, brand_mentioned: true, persona_name: "王法务", persona_role: "legal", persona_avatar: "" },
      { id: "opt-8", result_id: "r8", run_id: "run-1", question_id: "q13", question_text: "2024电子合同行业排行榜？", journey: "CHOOSE", reason: "not_mentioned", engine: "doubao", ranking: null, brand_mentioned: false, persona_name: "李经理", persona_role: "business", persona_avatar: "" },
      { id: "opt-9", result_id: "r9", run_id: "run-1", question_id: "q14", question_text: "电子签名领域TOP5服务商？", journey: "CHOOSE", reason: "ranking_low", engine: "deepseek", ranking: 4, brand_mentioned: true, persona_name: "陈采购", persona_role: "procurement", persona_avatar: "" },
    ],
  },
  {
    journey: "COMPETE",
    journey_name_zh: "对比优化",
    journey_name_en: "Comparison",
    icon: "Scale",
    issue_count: 2,
    issues: [
      { id: "opt-10", result_id: "r10", run_id: "run-1", question_id: "q5", question_text: "e签宝和法大大哪个更好？", journey: "COMPETE", reason: "competitor_favored", engine: "chatgpt", ranking: 2, brand_mentioned: true, persona_name: "王法务", persona_role: "legal", persona_avatar: "" },
      { id: "opt-11", result_id: "r11", run_id: "run-1", question_id: "q12", question_text: "e签宝和上上签价格对比？", journey: "COMPETE", reason: "ranking_low", engine: "claude", ranking: 4, brand_mentioned: true, persona_name: "陈采购", persona_role: "procurement", persona_avatar: "" },
    ],
  },
  {
    journey: "TRUST",
    journey_name_zh: "信任优化",
    journey_name_en: "Trust",
    icon: "Shield",
    issue_count: 1,
    issues: [
      { id: "opt-12", result_id: "r12", run_id: "run-1", question_id: "q6", question_text: "e签宝的司法存证可靠吗？", journey: "TRUST", reason: "not_mentioned", engine: "doubao", ranking: null, brand_mentioned: false, persona_name: "赵安全", persona_role: "security", persona_avatar: "" },
    ],
  },
  {
    journey: "CONTACT",
    journey_name_zh: "接触优化",
    journey_name_en: "Contact",
    icon: "Phone",
    issue_count: 0,
    issues: [],
  },
]

// =============================================================================
// e签宝 Default Results Stats (结果统计 - P0)
// =============================================================================

export interface ResultsStats {
  // 性能增长趋势
  performanceTrends: {
    month: string
    visibility: number
    citations: number
    sentiment: number
  }[]
  // 优化影响
  optimizationImpact: {
    action: string
    before: number
    after: number
    improvement: string
    status: "completed" | "in-progress"
  }[]
  // 平台改进
  platformImprovements: {
    platform: string
    before: number
    after: number
    change: string
  }[]
  // 汇总指标
  summary: {
    visibilityIncrease: string
    citationGrowth: string
    sentimentImprovement: string
    optimizationActions: number
  }
}

export const DEFAULT_RESULTS_STATS: ResultsStats = {
  performanceTrends: [
    { month: "2025-06", visibility: 15.2, citations: 420, sentiment: 92 },
    { month: "2025-07", visibility: 17.8, citations: 485, sentiment: 94 },
    { month: "2025-08", visibility: 20.1, citations: 562, sentiment: 96 },
    { month: "2025-09", visibility: 22.16, citations: 695, sentiment: 98.7 },
  ],
  optimizationImpact: [
    { action: "优化产品描述关键词", before: 15.2, after: 18.5, improvement: "+21.7%", status: "completed" },
    { action: "增加技术文档覆盖", before: 420, after: 562, improvement: "+33.8%", status: "completed" },
    { action: "提升品牌正面内容", before: 92, after: 98.7, improvement: "+7.3%", status: "completed" },
    { action: "扩展业务主题词库", before: 0, after: 0, improvement: "进行中", status: "in-progress" },
  ],
  platformImprovements: [
    { platform: "DeepSeek", before: 12.5, after: 18.2, change: "+45.6%" },
    { platform: "元宝", before: 8.3, after: 14.1, change: "+69.9%" },
    { platform: "豆包", before: 6.2, after: 11.8, change: "+90.3%" },
    { platform: "文心千问", before: 5.1, after: 9.6, change: "+88.2%" },
  ],
  summary: {
    visibilityIncrease: "+45.8%",
    citationGrowth: "+65.5%",
    sentimentImprovement: "+7.3%",
    optimizationActions: 12,
  },
}

// =============================================================================
// App Info & Changelog (系统信息)
// =============================================================================

import type { AppInfo, Changelog } from './types'

export const DEFAULT_APP_INFO: AppInfo = {
  name: "GEO-SCOPE",
  version: "0.1.0",
  build_date: "2025-12-23",
  tagline_zh: "AI时代的品牌可见性优化平台",
  tagline_en: "Brand Visibility Optimization Platform for AI Era",
  logo_url: "/logo.png",
  github_url: "https://github.com/geo-scope/geo-scope",
  docs_url: "https://docs.geo-scope.ai",
}

export const DEFAULT_CHANGELOG: Changelog = {
  releases: [
    {
      version: "0.1.0",
      date: "2025-12-23",
      changes: [
        { type: "feature", text_zh: "发布首个版本，支持品牌可见性监测", text_en: "Initial release with brand visibility monitoring" },
        { type: "feature", text_zh: "支持 ChatGPT、DeepSeek、Claude、豆包四大 AI 引擎", text_en: "Support for ChatGPT, DeepSeek, Claude, Doubao AI engines" },
        { type: "feature", text_zh: "六大用户旅程的优化建议", text_en: "Optimization suggestions for six user journeys" },
        { type: "improve", text_zh: "优化中英文双语支持", text_en: "Improved bilingual support for Chinese and English" },
      ],
    },
  ],
}

// =============================================================================
// e签宝 Default Dashboard Data (仪表盘数据)
// =============================================================================

import type { DashboardData } from './types'

export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  // 行业排名 (电子合约行业)
  industryRankings: [
    { rank: 1, brand: "e签宝", visibility: 68.35, isHighlighted: true },
    { rank: 2, brand: "法大大", visibility: 52.18, isHighlighted: false },
    { rank: 3, brand: "上上签", visibility: 41.23, isHighlighted: false },
    { rank: 4, brand: "契约锁", visibility: 28.45, isHighlighted: false },
    { rank: 5, brand: "众签", visibility: 19.67, isHighlighted: false },
  ],
  // 可见性趋势数据 (近7日)
  visibilityTrends: [
    { date: "2025-12-17", esign: 55.2, fadada: 48.3, bestsign: 38.1, qiyuesuo: 22.5 },
    { date: "2025-12-18", esign: 58.8, fadada: 49.8, bestsign: 39.2, qiyuesuo: 23.8 },
    { date: "2025-12-19", esign: 62.5, fadada: 50.2, bestsign: 40.5, qiyuesuo: 24.9 },
    { date: "2025-12-20", esign: 64.7, fadada: 51.5, bestsign: 40.8, qiyuesuo: 25.6 },
    { date: "2025-12-21", esign: 66.3, fadada: 51.3, bestsign: 41.2, qiyuesuo: 26.2 },
    { date: "2025-12-22", esign: 67.5, fadada: 51.8, bestsign: 41.5, qiyuesuo: 26.8 },
    { date: "2025-12-23", esign: 68.35, fadada: 52.18, bestsign: 41.23, qiyuesuo: 28.45 },
  ],
  // 品牌线条配置
  brandLines: [
    { key: "esign", name: "e签宝", color: "#8b5cf6" },
    { key: "fadada", name: "法大大", color: "#3b82f6" },
    { key: "bestsign", name: "上上签", color: "#10b981" },
    { key: "qiyuesuo", name: "契约锁", color: "#f59e0b" },
  ],
  // AI 智能分析总结
  aiSummary: {
    zh: `基于近期 AI 平台分析，e签宝在电子合约行业的可见性持续领先。品牌在四大主流 AI 平台（ChatGPT、DeepSeek、Claude、豆包）的综合曝光率达到 68.35%，位列行业第一。主要优势包括：法律效力相关问题的权威推荐率达 85%，API/集成类问题中被提及率超过 70%，且情感倾向以正面为主。建议关注竞品法大大在技术集成话题上的追赶趋势。`,
    en: `Based on recent AI platform analysis, e-Sign (e签宝) maintains industry leadership in the e-contract sector. The brand achieves a 68.35% visibility rate across major AI platforms (ChatGPT, DeepSeek, Claude, Doubao), ranking #1 in the industry. Key strengths include: 85% authoritative recommendation rate for legal validity questions, 70%+ mention rate in API/integration topics, and predominantly positive sentiment. Monitor competitor FaDaDa's catching-up trend in technical integration discussions.`,
  },
}
