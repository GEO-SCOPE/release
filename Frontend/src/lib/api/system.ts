/**
 * System API (系统信息、版本、更新日志)
 */

import { requestWithFallback } from '@/api/config'
import type { AppInfo, Changelog } from '@/api/types'
import { DEFAULT_APP_INFO, DEFAULT_CHANGELOG } from '@/api/defaults'

export const systemApi = {
  /**
   * 获取应用信息（版本、名称等）
   */
  getAppInfo: async (): Promise<AppInfo> => {
    return requestWithFallback(
      "/api/system/info",
      {},
      DEFAULT_APP_INFO
    )
  },

  /**
   * 获取更新日志
   */
  getChangelog: async (): Promise<Changelog> => {
    return requestWithFallback(
      "/api/system/changelog",
      {},
      DEFAULT_CHANGELOG
    )
  },
}
