/**
 * Project API
 */

import {
  request,
  requestWithFallback,
  isMockMode,
} from '@/api/config'

import type { Project, ProjectAssets } from '@/api/types'
import { DEFAULT_PROJECT } from '@/api/defaults'

export const projectApi = {
  list: async (): Promise<{ projects: Project[]; total: number }> => {
    return requestWithFallback(
      "/api/projects",
      {},
      { projects: [DEFAULT_PROJECT], total: 1 }
    )
  },

  get: async (projectId: string): Promise<Project> => {
    return requestWithFallback(
      `/api/projects/${projectId}`,
      {},
      DEFAULT_PROJECT
    )
  },

  create: async (data: {
    brand_name: string
    industry: string
    language?: string
  }): Promise<Project> => {
    if (isMockMode) {
      return {
        ...DEFAULT_PROJECT,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        brand_name: data.brand_name,
        industry: data.industry,
        language: data.language || "zh",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
    return request("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (
    projectId: string,
    data: Partial<Project>
  ): Promise<Project> => {
    if (isMockMode) {
      return {
        ...DEFAULT_PROJECT,
        ...data,
        id: projectId,
        updated_at: new Date().toISOString(),
      } as Project
    }
    return request(`/api/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  updateAssets: async (
    projectId: string,
    assets: ProjectAssets
  ): Promise<Project> => {
    if (isMockMode) {
      return {
        ...DEFAULT_PROJECT,
        id: projectId,
        assets,
        updated_at: new Date().toISOString(),
      }
    }
    return request(`/api/projects/${projectId}/assets`, {
      method: "PUT",
      body: JSON.stringify(assets),
    })
  },

  delete: async (projectId: string): Promise<void> => {
    if (isMockMode) {
      return
    }
    return request(`/api/projects/${projectId}`, {
      method: "DELETE",
    })
  },
}
