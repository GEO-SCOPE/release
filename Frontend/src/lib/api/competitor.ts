/**
 * Competitor Analysis API
 */

import { API_BASE_URL, ApiError } from '@/api/config'
import type { CompetitorAnalysis } from '@/api/types'

// AI 分析可能需要较长时间，使用 120 秒超时
const AI_ANALYSIS_TIMEOUT = 120000

export const competitorAnalysisApi = {
  /**
   * 生成竞品分析（使用更长的超时时间）
   */
  analyze: async (resultId: string): Promise<CompetitorAnalysis> => {
    const url = `${API_BASE_URL}/api/competitor-analysis/results/${resultId}/analyze`
    console.log("[Competitor API] Starting analysis request:", url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), AI_ANALYSIS_TIMEOUT)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          response.status,
          errorData.detail || `HTTP ${response.status}`,
          errorData.error
        )
      }

      const data = await response.json()
      console.log("[Competitor API] Analysis response:", data)
      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(0, "AI 分析超时，请稍后重试")
      }

      throw error
    }
  },

  /**
   * 获取已有的竞品分析
   */
  get: async (resultId: string): Promise<CompetitorAnalysis | null> => {
    const url = `${API_BASE_URL}/api/competitor-analysis/results/${resultId}/analysis`

    try {
      const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new ApiError(response.status, `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.warn("[Competitor API] Get analysis failed:", error)
      return null
    }
  },
}
