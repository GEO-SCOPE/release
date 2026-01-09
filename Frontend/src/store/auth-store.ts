/**
 * Auth Store - 认证状态管理
 * 管理登录状态、token、用户会话
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  // State
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  tokenExpiry: number | null

  // Actions
  setToken: (token: string, refreshToken?: string, expiresIn?: number) => void
  clearAuth: () => void
  isTokenExpired: () => boolean
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      tokenExpiry: null,

      // Set token after login
      setToken: (token: string, refreshToken?: string, expiresIn?: number) => {
        const expiry = expiresIn ? Date.now() + expiresIn * 1000 : null
        set({
          token,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          tokenExpiry: expiry,
        })
      },

      // Clear auth state (used internally)
      clearAuth: () => {
        set({
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          tokenExpiry: null,
        })
      },

      // Check if token is expired
      isTokenExpired: () => {
        const { tokenExpiry } = get()
        if (!tokenExpiry) return false
        return Date.now() > tokenExpiry
      },

      // Logout - clear state and call API
      logout: async () => {
        const { token, clearAuth } = get()

        // Call logout API if we have a token
        if (token) {
          try {
            const response = await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })
            if (!response.ok) {
              console.warn('Logout API call failed, but clearing local state anyway')
            }
          } catch (error) {
            console.warn('Logout API error:', error)
          }
        }

        // Clear local state regardless of API result
        clearAuth()

        // Redirect to login page
        window.location.href = '/login'
      },
    }),
    {
      name: 'geo-scope-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        tokenExpiry: state.tokenExpiry,
      }),
    }
  )
)

// Helper function to get auth header
export const getAuthHeader = (): Record<string, string> => {
  const { token } = useAuthStore.getState()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

// Helper to check if user is logged in
export const isLoggedIn = (): boolean => {
  const { isAuthenticated, isTokenExpired } = useAuthStore.getState()
  return isAuthenticated && !isTokenExpired()
}
