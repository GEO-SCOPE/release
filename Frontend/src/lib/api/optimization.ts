/**
 * Optimization API (六大旅程优化建议)
 */

import { request, isMockMode } from '@/api/config'
import type { JourneyOptimization } from '@/api/types'
import { DEFAULT_JOURNEY_OPTIMIZATIONS } from '@/api/defaults'

export const optimizationApi = {
  /**
   * 获取按六大旅程分类的优化建议
   */
  list: async (projectId: string): Promise<{ optimizations: JourneyOptimization[]; total_issues: number }> => {
    if (isMockMode) {
      const totalIssues = DEFAULT_JOURNEY_OPTIMIZATIONS.reduce((sum, j) => sum + j.issue_count, 0)
      return {
        optimizations: DEFAULT_JOURNEY_OPTIMIZATIONS,
        total_issues: totalIssues,
      }
    }
    return request(`/api/projects/${projectId}/optimizations`)
  },

  /**
   * 获取特定旅程的优化建议
   */
  getByJourney: async (projectId: string, journey: string): Promise<JourneyOptimization | null> => {
    if (isMockMode) {
      return DEFAULT_JOURNEY_OPTIMIZATIONS.find(j => j.journey === journey) || null
    }
    return request(`/api/projects/${projectId}/optimizations/${journey}`)
  },
}
