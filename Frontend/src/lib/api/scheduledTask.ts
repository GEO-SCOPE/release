/**
 * ScheduledTask API
 */

import {
  request,
  isMockMode,
} from '@/api/config'

import type { AIEngine } from '@/api/types'

// ScheduledTask types
export interface ScheduledTask {
  id: string
  project_id: string
  benchmark_id: string
  benchmark_name: string
  name: string
  engines: AIEngine[]
  channels: string[]
  frequency: "daily" | "weekly" | "monthly"
  day_of_week?: number // 0-6 (Sunday-Saturday)
  day_of_month?: number // 1-31
  time: string // HH:mm format
  enabled: boolean
  last_run_at?: string
  next_run_at?: string
  last_run_id?: string
  last_run_status?: string
  run_count: number
  created_at: string
  updated_at: string
}

export interface ScheduledTaskCreate {
  name: string
  benchmark_id: string
  engines: AIEngine[]
  channels?: string[]
  frequency: "daily" | "weekly" | "monthly"
  day_of_week?: number
  day_of_month?: number
  time: string
  enabled?: boolean
}

export interface ScheduledTaskUpdate {
  name?: string
  benchmark_id?: string
  engines?: AIEngine[]
  channels?: string[]
  frequency?: "daily" | "weekly" | "monthly"
  day_of_week?: number
  day_of_month?: number
  time?: string
  enabled?: boolean
}

// Local storage key for mock mode
const STORAGE_KEY = "scheduledTasks"

// Helper to get mock tasks from localStorage
const getMockTasks = (projectId: string): ScheduledTask[] => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    const allTasks = JSON.parse(stored) as ScheduledTask[]
    return allTasks.filter(t => t.project_id === projectId)
  } catch {
    return []
  }
}

// Helper to save mock tasks to localStorage
const saveMockTasks = (projectId: string, tasks: ScheduledTask[]) => {
  const stored = localStorage.getItem(STORAGE_KEY)
  let allTasks: ScheduledTask[] = []
  try {
    if (stored) allTasks = JSON.parse(stored)
  } catch {
    // ignore
  }
  // Remove old tasks for this project
  allTasks = allTasks.filter(t => t.project_id !== projectId)
  // Add updated tasks
  allTasks = [...allTasks, ...tasks]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks))
}

export const scheduledTaskApi = {
  /**
   * List all scheduled tasks for a project
   */
  list: async (projectId: string): Promise<{ tasks: ScheduledTask[]; total: number }> => {
    if (isMockMode) {
      const tasks = getMockTasks(projectId)
      return { tasks, total: tasks.length }
    }
    return request<{ tasks: ScheduledTask[]; total: number }>(
      `/api/projects/${projectId}/scheduled-tasks`
    )
  },

  /**
   * Get a single scheduled task
   */
  get: async (projectId: string, taskId: string): Promise<ScheduledTask> => {
    if (isMockMode) {
      const tasks = getMockTasks(projectId)
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error("Task not found")
      return task
    }
    return request<ScheduledTask>(
      `/api/projects/${projectId}/scheduled-tasks/${taskId}`
    )
  },

  /**
   * Create a new scheduled task
   */
  create: async (projectId: string, data: ScheduledTaskCreate): Promise<ScheduledTask> => {
    if (isMockMode) {
      const tasks = getMockTasks(projectId)
      const newTask: ScheduledTask = {
        id: `task_${Date.now()}`,
        project_id: projectId,
        benchmark_id: data.benchmark_id,
        benchmark_name: "", // Would need to look this up in real impl
        name: data.name,
        engines: data.engines,
        channels: data.channels || ["search"],
        frequency: data.frequency,
        day_of_week: data.day_of_week,
        day_of_month: data.day_of_month,
        time: data.time,
        enabled: data.enabled ?? true,
        run_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      saveMockTasks(projectId, [...tasks, newTask])
      return newTask
    }
    return request<ScheduledTask>(
      `/api/projects/${projectId}/scheduled-tasks`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    )
  },

  /**
   * Update a scheduled task
   */
  update: async (
    projectId: string,
    taskId: string,
    data: ScheduledTaskUpdate
  ): Promise<ScheduledTask> => {
    if (isMockMode) {
      const tasks = getMockTasks(projectId)
      const index = tasks.findIndex(t => t.id === taskId)
      if (index === -1) throw new Error("Task not found")
      const updated = {
        ...tasks[index],
        ...data,
        updated_at: new Date().toISOString(),
      }
      tasks[index] = updated
      saveMockTasks(projectId, tasks)
      return updated
    }
    return request<ScheduledTask>(
      `/api/projects/${projectId}/scheduled-tasks/${taskId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    )
  },

  /**
   * Delete a scheduled task
   */
  delete: async (projectId: string, taskId: string): Promise<{ success: boolean; message: string }> => {
    if (isMockMode) {
      const tasks = getMockTasks(projectId)
      const filtered = tasks.filter(t => t.id !== taskId)
      saveMockTasks(projectId, filtered)
      return { success: true, message: "Task deleted" }
    }
    return request<{ success: boolean; message: string }>(
      `/api/projects/${projectId}/scheduled-tasks/${taskId}`,
      { method: "DELETE" }
    )
  },

  /**
   * Toggle a scheduled task's enabled status
   */
  toggle: async (projectId: string, taskId: string): Promise<ScheduledTask> => {
    if (isMockMode) {
      const tasks = getMockTasks(projectId)
      const index = tasks.findIndex(t => t.id === taskId)
      if (index === -1) throw new Error("Task not found")
      tasks[index] = {
        ...tasks[index],
        enabled: !tasks[index].enabled,
        updated_at: new Date().toISOString(),
      }
      saveMockTasks(projectId, tasks)
      return tasks[index]
    }
    return request<ScheduledTask>(
      `/api/projects/${projectId}/scheduled-tasks/${taskId}/toggle`,
      { method: "POST" }
    )
  },
}
