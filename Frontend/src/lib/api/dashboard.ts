/**
 * Dashboard API (仪表盘数据)
 */

import { requestWithFallback } from '@/api/config'
import type { AIEngine, DashboardData } from '@/api/types'
import { DEFAULT_DASHBOARD_DATA } from '@/api/defaults'

export const dashboardApi = {
  /**
   * 获取仪表盘数据（行业排名、趋势、AI总结）
   */
  getData: async (projectId: string, engine?: AIEngine | "all"): Promise<DashboardData> => {
    const params = new URLSearchParams()
    if (engine && engine !== "all") {
      params.append("engine", engine)
    }
    const query = params.toString()
    return requestWithFallback(
      `/api/projects/${projectId}/dashboard${query ? `?${query}` : ""}`,
      {},
      DEFAULT_DASHBOARD_DATA
    )
  },
}
