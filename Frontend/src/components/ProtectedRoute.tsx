/**
 * ProtectedRoute - 路由保护组件
 * 检查用户是否已登录，未登录则重定向到登录页
 */

import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/auth-store"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()

  // 使用 Zustand hook 确保响应式更新
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const tokenExpiry = useAuthStore((state) => state.tokenExpiry)

  // 检查是否已登录且 token 未过期
  const isTokenExpired = tokenExpiry ? Date.now() > tokenExpiry : false
  const isLoggedIn = isAuthenticated && !isTokenExpired

  // 未登录则重定向到登录页
  if (!isLoggedIn) {
    // 保存当前路径，登录后可以重定向回来
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
