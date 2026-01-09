/**
 * Persona API
 * 注意：返回的 avatar 是相对路径，显示时需要使用 normalizeAvatarUrl 处理
 */

import {
  request,
  requestWithFallback,
  isMockMode,
} from '@/api/config'

import type { Persona } from '@/api/types'
import { DEFAULT_PERSONAS } from '@/api/defaults'

export const personaApi = {
  list: async (
    projectId: string
  ): Promise<{ personas: Persona[]; total: number }> => {
    return requestWithFallback(
      `/api/projects/${projectId}/personas`,
      {},
      { personas: DEFAULT_PERSONAS, total: DEFAULT_PERSONAS.length }
    )
  },

  get: async (projectId: string, personaId: string): Promise<Persona> => {
    return requestWithFallback(
      `/api/projects/${projectId}/personas/${personaId}`,
      {},
      DEFAULT_PERSONAS[0]
    )
  },

  create: async (
    projectId: string,
    data: Omit<Persona, "id" | "project_id" | "created_at">
  ): Promise<Persona> => {
    if (isMockMode) {
      return {
        ...data,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        project_id: projectId,
        created_at: new Date().toISOString(),
      } as Persona
    }
    return request(`/api/projects/${projectId}/personas`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (
    projectId: string,
    personaId: string,
    data: Partial<Persona>
  ): Promise<Persona> => {
    if (isMockMode) {
      return {
        id: personaId,
        project_id: projectId,
        ...data,
      } as Persona
    }
    return request(`/api/projects/${projectId}/personas/${personaId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  delete: async (projectId: string, personaId: string): Promise<void> => {
    if (isMockMode) {
      return
    }
    return request(`/api/projects/${projectId}/personas/${personaId}`, {
      method: "DELETE",
    })
  },

  generate: async (
    projectId: string,
    count: number = 6
  ): Promise<{ personas: Persona[]; total: number }> => {
    return requestWithFallback(
      `/api/projects/${projectId}/personas/generate`,
      { method: "POST", body: JSON.stringify({ count }) },
      { personas: DEFAULT_PERSONAS.slice(0, count), total: count }
    )
  },
}
