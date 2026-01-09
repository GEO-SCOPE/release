/**
 * Auth API (认证)
 */

import { request, isMockMode } from '@/api/config'
import type { User } from '@/api/types'
import { DEFAULT_USER } from '@/api/defaults'

export interface LoginResponse {
  token: string
  refresh_token: string
  expires_in: number
  user: User
}

export interface AuthVerifyResponse {
  valid: boolean
  user: User | null
}

export const authApi = {
  /**
   * 用户登录
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    if (isMockMode) {
      return {
        token: `mock-token-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
        expires_in: 86400,
        user: DEFAULT_USER,
      }
    }
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  },

  /**
   * 用户登出
   */
  logout: async (token: string): Promise<{ message: string }> => {
    if (isMockMode) {
      return { message: "Logged out successfully" }
    }
    return request("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },

  /**
   * 刷新 Token
   */
  refresh: async (refreshToken: string): Promise<{ token: string; refresh_token: string; expires_in: number }> => {
    if (isMockMode) {
      return {
        token: `mock-token-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
        expires_in: 86400,
      }
    }
    return request(`/api/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
      method: "POST",
    })
  },

  /**
   * 验证 Token 是否有效
   */
  verify: async (token: string): Promise<AuthVerifyResponse> => {
    if (isMockMode) {
      return { valid: true, user: DEFAULT_USER }
    }
    return request("/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },
}
