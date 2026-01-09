/**
 * Question API
 */

import { request, isMockMode } from '@/api/config'

export const questionApi = {
  create: async (
    projectId: string,
    benchmarkId: string,
    data: {
      text: string
      intent: string
      persona_name?: string
      persona_role?: string
      keyword?: string
      source?: string
      relevance?: string
      is_approved?: boolean
    }
  ): Promise<void> => {
    if (isMockMode) {
      return
    }
    return request(
      `/api/projects/${projectId}/benchmarks/${benchmarkId}/questions`,
      { method: "POST", body: JSON.stringify(data) }
    )
  },

  approve: async (
    projectId: string,
    questionId: string,
    isApproved: boolean
  ): Promise<void> => {
    if (isMockMode) {
      return
    }
    return request(
      `/api/projects/${projectId}/questions/${questionId}/approve`,
      { method: "PUT", body: JSON.stringify({ is_approved: isApproved }) }
    )
  },

  setRelevance: async (
    projectId: string,
    questionId: string,
    relevance: string
  ): Promise<void> => {
    if (isMockMode) {
      return
    }
    return request(
      `/api/projects/${projectId}/questions/${questionId}/relevance`,
      { method: "PUT", body: JSON.stringify({ relevance }) }
    )
  },

  update: async (
    projectId: string,
    questionId: string,
    data: {
      text?: string
      intent?: string
      persona_name?: string
      persona_role?: string
      keyword?: string
      source?: string
      relevance?: string
      is_approved?: boolean
    }
  ): Promise<void> => {
    if (isMockMode) {
      return
    }
    return request(
      `/api/projects/${projectId}/questions/${questionId}`,
      { method: "PUT", body: JSON.stringify(data) }
    )
  },

  delete: async (
    projectId: string,
    questionId: string
  ): Promise<void> => {
    if (isMockMode) {
      return
    }
    return request(
      `/api/projects/${projectId}/questions/${questionId}`,
      { method: "DELETE" }
    )
  },
}
