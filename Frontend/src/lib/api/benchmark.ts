/**
 * Benchmark API
 */

import {
  request,
  requestWithFallback,
  isMockMode,
  API_BASE_URL,
} from '@/api/config'

import type {
  PersonaRole,
  BenchmarkScenario,
  Benchmark,
  BenchmarkVersion,
  BenchmarkVersionDetail,
  GenerateScenarioRequest,
  GenerateScenarioResponse,
} from '@/api/types'
import { DEFAULT_BENCHMARKS } from '@/api/defaults'

export const benchmarkApi = {
  list: async (
    projectId: string
  ): Promise<{ benchmarks: Benchmark[]; total: number }> => {
    return requestWithFallback(
      `/api/projects/${projectId}/benchmarks`,
      {},
      { benchmarks: DEFAULT_BENCHMARKS, total: DEFAULT_BENCHMARKS.length }
    )
  },

  get: async (projectId: string, benchmarkId: string): Promise<Benchmark> => {
    return requestWithFallback(
      `/api/projects/${projectId}/benchmarks/${benchmarkId}`,
      {},
      DEFAULT_BENCHMARKS[0]
    )
  },

  create: async (
    projectId: string,
    data: {
      name: string
      scenario: BenchmarkScenario
      target_roles: PersonaRole[]
      questions_per_stage?: number
    }
  ): Promise<Benchmark> => {
    if (isMockMode) {
      return {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        project_id: projectId,
        name: data.name,
        scenario: data.scenario,
        target_roles: data.target_roles,
        questions_per_stage: data.questions_per_stage || 6,
        total_questions: (data.questions_per_stage || 6) * 6,
        is_active: false,
        status: "draft",
        current_version: "1.0",
        questions: [],
        created_at: new Date().toISOString(),
      }
    }
    return request(`/api/projects/${projectId}/benchmarks`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  generate: async (
    projectId: string,
    data: {
      name?: string
      scenario: BenchmarkScenario
      target_roles: PersonaRole[]
      questions_per_stage?: number
    }
  ): Promise<Benchmark> => {
    return requestWithFallback(
      `/api/projects/${projectId}/benchmarks/generate`,
      { method: "POST", body: JSON.stringify(data) },
      {
        ...DEFAULT_BENCHMARKS[0],
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        project_id: projectId,
        scenario: data.scenario,
        target_roles: data.target_roles,
        questions_per_stage: data.questions_per_stage || 6,
      }
    )
  },

  /**
   * Generate benchmark with SSE streaming for real-time progress updates.
   */
  generateStream: async (
    projectId: string,
    data: {
      name?: string
      scenario: string
      target_roles?: string[]  // Deprecated, use target_persona_ids
      target_persona_ids?: string[]  // Preferred: List of persona IDs
      questions_per_stage?: number
      language?: string  // Language for generated questions (zh/en/ja/...)
    },
    callbacks: {
      onBenchmarkCreated?: (data: { benchmark_id: string; name: string }) => void
      onStageStart?: (data: { stage: string; stage_name: string; index: number; total: number }) => void
      onQuestionGenerated?: (data: { question: { id: string; text: string; intent: string; persona_name: string }; stage: string; index: number }) => void
      onStageComplete?: (data: { stage: string; stage_name: string; count: number }) => void
      onComplete?: (data: { benchmark_id: string; total_questions: number; status: string }) => void
      onError?: (error: string) => void
    }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const url = `${API_BASE_URL}/api/projects/${projectId}/benchmarks/generate/stream`

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('No response body')
          }

          const decoder = new TextDecoder()
          let buffer = ''

          const processStream = async () => {
            while (true) {
              const { done, value } = await reader.read()

              if (done) {
                break
              }

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              let currentEvent = ''
              for (const line of lines) {
                if (line.startsWith('event: ')) {
                  currentEvent = line.slice(7).trim()
                } else if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6)
                  try {
                    const eventData = JSON.parse(dataStr)

                    switch (currentEvent) {
                      case 'benchmark_created':
                        console.log('[SSE] benchmark_created:', eventData)
                        callbacks.onBenchmarkCreated?.(eventData)
                        break
                      case 'stage_start':
                        console.log('[SSE] stage_start:', eventData)
                        callbacks.onStageStart?.(eventData)
                        break
                      case 'question_generated':
                        console.log('[SSE] question_generated:', eventData)
                        callbacks.onQuestionGenerated?.(eventData)
                        break
                      case 'heartbeat':
                        console.log('[SSE] heartbeat:', eventData)
                        break
                      case 'stage_complete':
                        callbacks.onStageComplete?.(eventData)
                        break
                      case 'generation_complete':
                        callbacks.onComplete?.(eventData)
                        resolve(eventData.benchmark_id)
                        break
                      case 'error':
                        callbacks.onError?.(eventData.error)
                        reject(new Error(eventData.error))
                        break
                    }
                  } catch {
                    // Ignore parse errors for incomplete data
                  }
                }
              }
            }
          }

          processStream().catch(reject)
        })
        .catch(error => {
          callbacks.onError?.(error.message)
          reject(error)
        })
    })
  },

  /**
   * Generate scenario description based on product or business scope.
   * Uses AI to create a relevant test scenario from the selected source.
   */
  generateScenario: async (
    projectId: string,
    data: GenerateScenarioRequest
  ): Promise<GenerateScenarioResponse> => {
    if (isMockMode) {
      return {
        scenario: "企业在数字化转型中如何选择合适的解决方案",
        source_name: "Mock Product",
        source_description: "Mock description",
      }
    }
    return request(`/api/projects/${projectId}/benchmarks/generate-scenario`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  activate: async (projectId: string, benchmarkId: string): Promise<void> => {
    if (isMockMode) {
      return
    }
    return request(
      `/api/projects/${projectId}/benchmarks/${benchmarkId}/activate`,
      { method: "POST" }
    )
  },

  delete: async (projectId: string, benchmarkId: string): Promise<void> => {
    if (isMockMode) {
      return
    }
    return request(`/api/projects/${projectId}/benchmarks/${benchmarkId}`, {
      method: "DELETE",
    })
  },

  update: async (
    projectId: string,
    benchmarkId: string,
    data: {
      name?: string
      scenario?: string
      target_roles?: string[]
      status?: string
      is_active?: boolean
    }
  ): Promise<Benchmark> => {
    if (isMockMode) {
      return {
        ...DEFAULT_BENCHMARKS[0],
        id: benchmarkId,
        project_id: projectId,
        ...data,
      } as Benchmark
    }
    return request(`/api/projects/${projectId}/benchmarks/${benchmarkId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // Version Management
  listVersions: async (
    projectId: string,
    benchmarkId: string
  ): Promise<{ versions: BenchmarkVersion[]; total: number }> => {
    if (isMockMode) {
      return { versions: [], total: 0 }
    }
    return request(`/api/projects/${projectId}/benchmarks/${benchmarkId}/versions`)
  },

  getVersion: async (
    projectId: string,
    benchmarkId: string,
    versionId: string
  ): Promise<BenchmarkVersionDetail> => {
    return request(`/api/projects/${projectId}/benchmarks/${benchmarkId}/versions/${versionId}`)
  },

  restoreVersion: async (
    projectId: string,
    benchmarkId: string,
    versionId: string
  ): Promise<{ success: boolean; message: string; new_version: string }> => {
    if (isMockMode) {
      return { success: true, message: "Version restored", new_version: "1.0" }
    }
    return request(
      `/api/projects/${projectId}/benchmarks/${benchmarkId}/versions/${versionId}/restore`,
      { method: "POST" }
    )
  },

  // Import & Template APIs
  getTemplate: async (
    projectId: string,
    templateType: "legal" | "api"
  ): Promise<{
    _readme?: { zh: string; en: string }
    _field_descriptions?: Record<string, unknown>
    _project_personas?: Array<{
      role: string
      name_zh: string
      name_en: string
      description: string
    }>
    name: string
    name_en: string
    scenario: string
    scenario_en?: string
    questions: Array<{
      text: string
      text_en?: string
      intent: string
      persona_name: string
      persona_name_en?: string
      persona_role: string
      keyword: string
      keyword_en?: string
    }>
  }> => {
    if (isMockMode) {
      return {
        _project_personas: [
          { role: "legal", name_zh: "法务负责人", name_en: "Legal Director", description: "负责法律合规" },
          { role: "it", name_zh: "IT架构师", name_en: "IT Architect", description: "负责技术实现" },
          { role: "business", name_zh: "业务经理", name_en: "Business Manager", description: "负责业务运营" },
        ],
        name: templateType === "legal" ? "法律效力测试模板" : "API集成测试模板",
        name_en: templateType === "legal" ? "Legal Validity Test Template" : "API Integration Test Template",
        scenario: templateType === "legal"
          ? "企业在数字化转型过程中，法务部门需要评估电子合同和电子签名的法律效力。公司计划将传统纸质合同流程迁移到线上，法务团队正在调研各电子签名平台的法律认证资质、司法采信能力以及合规性，以确保企业的电子合同在法律诉讼中具有同等效力。"
          : "技术团队计划将电子签名功能集成到现有的企业OA系统和业务流程中。IT部门需要评估不同电子签名平台的API能力、技术文档质量、集成复杂度和技术支持响应速度，同时安全团队需要确认是否支持私有化部署以满足企业数据安全合规要求。",
        scenario_en: templateType === "legal"
          ? "During digital transformation, the legal department needs to evaluate the legal validity of electronic contracts and e-signatures. The company plans to migrate traditional paper-based contract processes online. The legal team is researching various e-signature platforms' legal certifications, judicial admissibility, and compliance to ensure the company's electronic contracts have equal legal standing in litigation."
          : "The technical team plans to integrate e-signature functionality into the existing enterprise OA system and business processes. The IT department needs to evaluate different e-signature platforms' API capabilities, documentation quality, integration complexity, and technical support responsiveness. Meanwhile, the security team needs to confirm whether private deployment is supported to meet enterprise data security compliance requirements.",
        questions: [
          {
            text: templateType === "legal" ? "电子合同有法律效力吗？" : "如何将电子签名集成到OA系统？",
            text_en: templateType === "legal" ? "Do electronic contracts have legal validity?" : "How to integrate e-signatures into the OA system?",
            intent: "AWARE",
            persona_name: "法务负责人",
            persona_name_en: "Legal Director",
            persona_role: "legal",
            keyword: "法律效力",
            keyword_en: "legal validity",
          },
        ],
      }
    }
    return request(`/api/projects/${projectId}/benchmarks/templates/${templateType}`)
  },

  import: async (
    projectId: string,
    data: {
      name?: string
      scenario?: string
      questions: Array<{
        text: string
        intent?: string
        persona_name?: string
        persona_role?: string
        keyword?: string
      }>
    }
  ): Promise<{
    success: boolean
    benchmark_id: string
    name: string
    total_questions: number
    message: string
  }> => {
    if (isMockMode) {
      return {
        success: true,
        benchmark_id: `local-${Date.now()}`,
        name: data.name || "导入问题库",
        total_questions: data.questions.length,
        message: `成功导入 ${data.questions.length} 个问题`,
      }
    }
    return request(`/api/projects/${projectId}/benchmarks/import`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  importFile: async (
    projectId: string,
    file: File
  ): Promise<{
    success: boolean
    benchmark_id: string
    name: string
    total_questions: number
    message: string
  }> => {
    if (isMockMode) {
      return {
        success: true,
        benchmark_id: `local-${Date.now()}`,
        name: "导入问题库",
        total_questions: 6,
        message: "成功导入 6 个问题",
      }
    }
    const formData = new FormData()
    formData.append("file", file)
    return request(`/api/projects/${projectId}/benchmarks/import/file`, {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  },
}
