/**
 * Metrics API
 */

import { requestWithFallback } from '@/api/config'
import type { AIEngine, Metrics } from '@/api/types'
import { DEFAULT_METRICS } from '@/api/defaults'

export const metricsApi = {
  get: async (projectId: string, engine?: AIEngine | "all"): Promise<Metrics> => {
    const params = new URLSearchParams()
    if (engine && engine !== "all") {
      params.append("engine", engine)
    }
    const query = params.toString()
    const data = await requestWithFallback<Partial<Metrics>>(
      `/api/projects/${projectId}/metrics${query ? `?${query}` : ""}`,
      {},
      DEFAULT_METRICS
    )
    // Merge with defaults to ensure all fields have values
    return { ...DEFAULT_METRICS, ...data }
  },
}
