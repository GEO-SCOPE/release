import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/lib/theme-context'

// Download Page
import ReleasePage from '@/pages/ReleasePage'

// =============================================================================
// 注意：这是一个独立的下载页面项目
// 其他路由已注释，如需恢复完整应用，请取消注释
// =============================================================================

// import { I18nProvider } from '@/lib/i18n'
// import { AccentColorProvider } from '@/lib/accent-color'
// import { FluentProviderWrapper } from '@/components/providers/fluent-provider'
// import { AntdProvider } from '@/components/providers/antd-provider'
// import { PublicLayout } from '@/components/layouts/PublicLayout'
// import { DashboardLayout } from '@/components/layouts/DashboardLayout'

// App Pages (已注释)
// import HomePage from '@/pages/HomePage'
// import AssetsPage from '@/pages/AssetsPage'
// import PersonaPage from '@/pages/PersonaPage'
// import BenchmarkListPage from '@/pages/BenchmarkListPage'
// import BenchmarkDetailPage from '@/pages/BenchmarkDetailPage'
// import RunCenterPage from '@/pages/RunCenterPage'
// import WorkspacePage from '@/pages/WorkspacePage'
// import OptimizePage from '@/pages/OptimizePage'
// import LoginPage from '@/pages/auth/LoginPage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Download Page - 唯一路由 */}
          <Route path="/" element={<ReleasePage />} />
          <Route path="/download" element={<ReleasePage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />

          {/* ============================================================= */}
          {/* 以下路由已注释，如需恢复完整应用请取消注释                          */}
          {/* ============================================================= */}

          {/* Auth Routes */}
          {/* <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} /> */}

          {/* Dashboard Routes */}
          {/* <Route path="/" element={<DashboardLayout><HomePage /></DashboardLayout>} /> */}
          {/* <Route path="/assets" element={<DashboardLayout><AssetsPage /></DashboardLayout>} /> */}
          {/* <Route path="/personas" element={<DashboardLayout><PersonaPage /></DashboardLayout>} /> */}
          {/* <Route path="/benchmarks" element={<DashboardLayout><BenchmarkListPage /></DashboardLayout>} /> */}
          {/* <Route path="/benchmarks/:id" element={<DashboardLayout><BenchmarkDetailPage /></DashboardLayout>} /> */}
          {/* <Route path="/run-center" element={<DashboardLayout><RunCenterPage /></DashboardLayout>} /> */}
          {/* <Route path="/workspace" element={<DashboardLayout><WorkspacePage /></DashboardLayout>} /> */}
          {/* <Route path="/optimize" element={<DashboardLayout><OptimizePage /></DashboardLayout>} /> */}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
