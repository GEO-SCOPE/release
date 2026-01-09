/**
 * Sources API
 */

import {
  request,
  requestWithFallback,
  isMockMode,
} from '@/api/config'

import type { TrustedSource, SourceTier } from '@/api/types'
import { DEFAULT_TRUSTED_SOURCES } from '@/api/defaults'

export const sourceApi = {
  list: async (
    projectId: string
  ): Promise<{ sources: TrustedSource[]; total: number }> => {
    return requestWithFallback(
      `/api/projects/${projectId}/sources`,
      {},
      { sources: DEFAULT_TRUSTED_SOURCES, total: DEFAULT_TRUSTED_SOURCES.length }
    )
  },

  create: async (
    projectId: string,
    data: { domain: string; tier: SourceTier; description?: string }
  ): Promise<TrustedSource> => {
    if (isMockMode) {
      return {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        project_id: projectId,
        domain: data.domain,
        tier: data.tier,
        description: data.description || "",
        created_at: new Date().toISOString(),
      }
    }
    return request(`/api/projects/${projectId}/sources`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (
    projectId: string,
    sourceId: string,
    data: Partial<TrustedSource>
  ): Promise<TrustedSource> => {
    if (isMockMode) {
      return {
        id: sourceId,
        project_id: projectId,
        domain: data.domain || "",
        tier: data.tier || "official",
        description: data.description || "",
        created_at: data.created_at || new Date().toISOString(),
      }
    }
    return request(`/api/projects/${projectId}/sources/${sourceId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  delete: async (projectId: string, sourceId: string): Promise<void> => {
    if (isMockMode) {
      return
    }
    return request(`/api/projects/${projectId}/sources/${sourceId}`, {
      method: "DELETE",
    })
  },
}
