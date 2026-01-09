/**
 * User API (用户信息)
 */

import {
  request,
  requestWithFallback,
  isMockMode,
  API_BASE_URL,
  BACKEND_DIRECTORY,
} from '@/api/config'
import type { User } from '@/api/types'
import { DEFAULT_USER } from '@/api/defaults'

/**
 * 将相对 URL 转换为完整 URL
 * 检查是否已包含完整协议（http/https），如果是相对路径则拼接 API_BASE_URL
 */
export function normalizeAvatarUrl(url: string | undefined | null): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url
  }
  if (url.startsWith('/')) {
    // 移除 API_BASE_URL 结尾的斜杠，避免双斜杠问题
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    // 移除 BACKEND_DIRECTORY 结尾的斜杠
    const backendDir = BACKEND_DIRECTORY.endsWith('/') ? BACKEND_DIRECTORY.slice(0, -1) : BACKEND_DIRECTORY
    // 拼接：baseUrl + backendDirectory + url
    return `${base}${backendDir}${url}`
  }
  return url
}

export const userApi = {
  /**
   * 获取当前登录用户信息
   * 注意：返回的 avatar 是相对路径，显示时需要使用 normalizeAvatarUrl 处理
   */
  getCurrentUser: async (): Promise<User> => {
    return requestWithFallback<User>(
      "/api/user/me",
      {},
      DEFAULT_USER
    )
  },

  /**
   * 更新用户信息
   * 注意：返回的 avatar 是相对路径，显示时需要使用 normalizeAvatarUrl 处理
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    if (isMockMode) {
      return {
        ...DEFAULT_USER,
        ...data,
      }
    }
    return request<User>("/api/user/me", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  /**
   * 更新用户头像 URL
   */
  updateAvatar: async (avatarUrl: string): Promise<{ avatar: string }> => {
    if (isMockMode) {
      return { avatar: avatarUrl }
    }
    return request("/api/user/avatar", {
      method: "PUT",
      body: JSON.stringify({ avatar: avatarUrl }),
    })
  },

  /**
   * 上传用户头像文件
   * 返回的 url 是相对路径，显示时需要使用 normalizeAvatarUrl 处理
   */
  uploadAvatar: async (file: File, userId?: string): Promise<{ success: boolean; url: string; filename: string }> => {
    if (isMockMode) {
      return {
        success: true,
        url: URL.createObjectURL(file),
        filename: file.name,
      }
    }

    const formData = new FormData()
    formData.append("file", file)
    if (userId) {
      formData.append("user_id", userId)
    }

    const response = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || "Upload failed")
    }

    return response.json()
  },
}
