/**
 * Results Stats API (结果统计)
 */

import { request, requestWithFallback, isMockMode } from '@/api/config'
import { DEFAULT_RESULTS_STATS } from '@/api/defaults'

export interface ResultsStats {
  visibilityIncrease: number
  citationGrowth: number
  sentimentImprovement: number
  optimizationActions: number
  performanceTrends: {
    date: string
    visibility: number
    citations: number
    sentiment: number
  }[]
  platformImprovements: {
    platform: string
    before: number
    after: number
    improvement: number
  }[]
}

export const resultsApi = {
  /**
   * 获取结果统计数据
   */
  getStats: async (projectId: string): Promise<ResultsStats> => {
    return requestWithFallback(
      `/api/projects/${projectId}/results/stats`,
      {},
      DEFAULT_RESULTS_STATS
    )
  },

  /**
   * 获取性能趋势数据
   */
  getTrends: async (projectId: string, period?: string): Promise<ResultsStats['performanceTrends']> => {
    if (isMockMode) {
      return DEFAULT_RESULTS_STATS.performanceTrends
    }
    const query = period ? `?period=${period}` : ''
    return request(`/api/projects/${projectId}/results/trends${query}`)
  },
}
