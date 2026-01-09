/**
 * Run API (Core)
 */

import {
  request,
  requestWithFallback,
  isMockMode,
  API_BASE_URL,
} from '@/api/config'

import type {
  AIEngine,
  SimulationChannel,
  RiskSeverity,
  Run,
  RunWithResults,
  RunSummary,
  SimulationResult,
} from '@/api/types'
import { DEFAULT_RUNS, DEFAULT_SIMULATION_RESULTS } from '@/api/defaults'

export const runApi = {
  list: async (
    projectId: string
  ): Promise<{ runs: Run[]; total: number; default_run?: RunWithResults }> => {
    return requestWithFallback(
      `/api/projects/${projectId}/runs`,
      {},
      { runs: DEFAULT_RUNS, total: DEFAULT_RUNS.length, default_run: undefined }
    )
  },

  /**
   * 获取 run 基本信息（不包含 results）- 用于缓存版本比较
   */
  getRunOnly: async (
    projectId: string,
    runId: string
  ): Promise<Run> => {
    if (isMockMode) {
      const mockRun = DEFAULT_RUNS.find(r => r.id === runId) || DEFAULT_RUNS[0]
      return mockRun
    }
    return request<Run>(`/api/projects/${projectId}/runs/${runId}`)
  },

  /**
   * 获取 run 和 results（完整数据）
   */
  get: async (
    projectId: string,
    runId: string
  ): Promise<Run & { results: SimulationResult[] }> => {
    if (isMockMode) {
      const mockRun = DEFAULT_RUNS.find(r => r.id === runId) || DEFAULT_RUNS[0]
      return {
        ...mockRun,
        results: DEFAULT_SIMULATION_RESULTS.filter(r => r.run_id === mockRun.id),
      }
    }
    const [run, resultsData] = await Promise.all([
      request<Run>(`/api/projects/${projectId}/runs/${runId}`),
      request<{ results: SimulationResult[]; total: number }>(`/api/projects/${projectId}/runs/${runId}/results`),
    ])
    return {
      ...run,
      results: resultsData.results,
    }
  },

  create: async (
    projectId: string,
    data: {
      benchmark_id: string
      engines: AIEngine[]
      channels: SimulationChannel[]
      sample_strategy?: "all" | "random"
      sample_size?: number
    }
  ): Promise<Run> => {
    if (isMockMode) {
      return {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        project_id: projectId,
        benchmark_id: data.benchmark_id,
        engines: data.engines,
        channels: data.channels,
        sample_strategy: data.sample_strategy || "all",
        sample_size: data.sample_size,
        status: "completed",
        progress: {
          total: 24,
          completed: 24,
          failed: 0,
        },
        summary: DEFAULT_RUNS[0]?.summary,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
    }
    return request(`/api/projects/${projectId}/runs`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  retry: async (projectId: string, runId: string): Promise<Run> => {
    if (isMockMode) {
      const mockRun = DEFAULT_RUNS.find(r => r.id === runId) || DEFAULT_RUNS[0]
      return {
        ...mockRun,
        status: "running",
        progress: { total: mockRun.progress.total, completed: 0, failed: 0 },
      }
    }
    return request(`/api/projects/${projectId}/runs/${runId}/retry`, {
      method: "POST",
    })
  },

  getSummary: async (projectId: string, runId: string): Promise<RunSummary> => {
    if (isMockMode) {
      const mockRun = DEFAULT_RUNS.find(r => r.id === runId) || DEFAULT_RUNS[0]
      return mockRun.summary!
    }
    return request(`/api/projects/${projectId}/runs/${runId}/summary`)
  },

  /**
   * Start a run with SSE streaming for real-time progress updates.
   */
  runStream: async (
    projectId: string,
    data: {
      benchmark_id: string
      name?: string
      providers: AIEngine[]
      filters?: Record<string, unknown>
    },
    callbacks: {
      onRunCreated?: (data: { run_id: string; benchmark_id: string; name: string; providers: string[] }) => void
      onRunStarted?: (data: { run_id: string; total_questions: number; total_calls: number }) => void
      onQuestionStart?: (data: { question_id: string; question_text: string; index: number; total: number }) => void
      onProviderComplete?: (data: { question_id: string; provider: string; success: boolean; time_ms: number; error?: string }) => void
      onQuestionComplete?: (data: { question_id: string; success_count: number; failed_count: number }) => void
      onExecutionComplete?: (data: { total: number; success: number; failed: number; duration_ms: number }) => void
      onEvaluationStart?: (data: { stages: string[] }) => void
      onEvaluationProgress?: (data: { stage: string; current: number; total: number }) => void
      onAnalysisComplete?: (data: { analysis_id: string; summary_preview: string }) => void
      onRunComplete?: (data: { run_id: string; analysis_id: string; status: string; duration_ms: number }) => void
      onHeartbeat?: (data: { message: string }) => void
      onError?: (error: string) => void
    }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const url = `${API_BASE_URL}/api/projects/${projectId}/runs/stream`

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
                  console.log('[SSE Run] Event type:', currentEvent)
                } else if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6)
                  try {
                    const eventData = JSON.parse(dataStr)
                    console.log('[SSE Run] Event data:', currentEvent, eventData)

                    switch (currentEvent) {
                      case 'run_created':
                        console.log('[SSE Run] Calling onRunCreated callback')
                        callbacks.onRunCreated?.(eventData)
                        break
                      case 'run_started':
                        callbacks.onRunStarted?.(eventData)
                        break
                      case 'question_start':
                        callbacks.onQuestionStart?.(eventData)
                        break
                      case 'provider_complete':
                        callbacks.onProviderComplete?.(eventData)
                        break
                      case 'question_complete':
                        callbacks.onQuestionComplete?.(eventData)
                        break
                      case 'execution_complete':
                        callbacks.onExecutionComplete?.(eventData)
                        break
                      case 'evaluation_start':
                        callbacks.onEvaluationStart?.(eventData)
                        break
                      case 'evaluation_progress':
                        callbacks.onEvaluationProgress?.(eventData)
                        break
                      case 'analysis_complete':
                        callbacks.onAnalysisComplete?.(eventData)
                        break
                      case 'run_complete':
                        callbacks.onRunComplete?.(eventData)
                        resolve(eventData.run_id)
                        break
                      case 'heartbeat':
                        callbacks.onHeartbeat?.(eventData)
                        break
                      case 'error':
                        callbacks.onError?.(eventData.error || eventData.message)
                        reject(new Error(eventData.error || eventData.message))
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
   * Start a run as a background task (recommended).
   */
  start: async (
    projectId: string,
    data: {
      benchmark_id: string
      name?: string
      providers?: AIEngine[]
      filters?: Record<string, unknown>
    }
  ): Promise<{ run_id: string; status: string; message: string }> => {
    if (isMockMode) {
      return {
        run_id: `local-${Date.now()}`,
        status: "started",
        message: "Mock run started",
      }
    }
    return request(`/api/projects/${projectId}/runs/start`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete a run and all its related data.
   */
  delete: async (projectId: string, runId: string): Promise<{ success: boolean; message: string }> => {
    if (isMockMode) {
      return { success: true, message: "Run deleted" }
    }
    return request(`/api/projects/${projectId}/runs/${runId}`, {
      method: "DELETE",
    })
  },

  /**
   * Get progress of a running task.
   */
  getProgress: async (
    projectId: string,
    runId: string
  ): Promise<{
    run_id: string
    status: string
    current_stage: string
    total_questions: number
    completed_questions: number
    total_calls: number
    completed_calls: number
    failed_calls: number
    error: string | null
    started_at: string | null
    completed_at: string | null
  }> => {
    if (isMockMode) {
      return {
        run_id: runId,
        status: "completed",
        current_stage: "completed",
        total_questions: 6,
        completed_questions: 6,
        total_calls: 24,
        completed_calls: 24,
        failed_calls: 0,
        error: null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }
    }
    return request(`/api/projects/${projectId}/runs/${runId}/progress`)
  },

  getResults: async (
    projectId: string,
    runId: string,
    params?: {
      page?: number
      per_page?: number
      engine?: AIEngine
      channel?: SimulationChannel
      risk_level?: RiskSeverity
    }
  ): Promise<{ results: SimulationResult[]; total: number }> => {
    if (isMockMode) {
      let results = DEFAULT_SIMULATION_RESULTS.filter(r => r.run_id === runId)
      if (params?.engine) {
        results = results.filter(r => r.engine === params.engine)
      }
      if (params?.channel) {
        results = results.filter(r => r.channel === params.channel)
      }
      return { results, total: results.length }
    }

    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append("page", String(params.page))
    if (params?.per_page) searchParams.append("per_page", String(params.per_page))
    if (params?.engine) searchParams.append("engine", params.engine)
    if (params?.channel) searchParams.append("channel", params.channel)
    if (params?.risk_level) searchParams.append("risk_level", params.risk_level)

    const query = searchParams.toString()
    return request(`/api/projects/${projectId}/runs/${runId}/results${query ? `?${query}` : ""}`)
  },
}
