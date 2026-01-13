import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/lib/theme-context'
import { LogoProvider } from '@/lib/logo-context'
import { I18nProvider } from '@/lib/i18n'

// Download Page
import ReleasePage from '@/pages/ReleasePage'
import ChangelogPage from '@/pages/ChangelogPage'

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
      <I18nProvider>
        <LogoProvider>
          <div className="relative min-h-screen">
            {/* =================================================================== */}
            {/* Fluent Design Background Layer with Animated Orbs                   */}
            {/* =================================================================== */}
            <div className="fixed inset-0 z-0 overflow-hidden">
              {/* Base gradient layer - 使用更淡的背景让光球更明显 */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />

              {/* Animated floating orbs using theme colors */}
              <div className="absolute inset-0">
                {/* Orb 1 - Primary color */}
                <div
                  className="absolute w-[500px] h-[500px] rounded-full opacity-40 dark:opacity-20 animate-float"
                  style={{
                    background: 'radial-gradient(circle, color-mix(in oklch, var(--primary) 90%, transparent) 0%, transparent 70%)',
                    top: '10%',
                    left: '10%',
                    animationDuration: '20s',
                    animationDelay: '0s',
                    filter: 'blur(80px)',
                  }}
                />

                {/* Orb 2 - Accent color */}
                <div
                  className="absolute w-[400px] h-[400px] rounded-full opacity-35 dark:opacity-18 animate-float"
                  style={{
                    background: 'radial-gradient(circle, color-mix(in oklch, var(--accent) 85%, transparent) 0%, transparent 70%)',
                    top: '60%',
                    right: '15%',
                    animationDuration: '25s',
                    animationDelay: '5s',
                    filter: 'blur(80px)',
                  }}
                />

                {/* Orb 3 - Success color */}
                <div
                  className="absolute w-[350px] h-[350px] rounded-full opacity-30 dark:opacity-15 animate-float"
                  style={{
                    background: 'radial-gradient(circle, color-mix(in oklch, var(--success) 80%, transparent) 0%, transparent 70%)',
                    bottom: '10%',
                    left: '20%',
                    animationDuration: '30s',
                    animationDelay: '10s',
                    filter: 'blur(80px)',
                  }}
                />

                {/* Orb 4 - Warning color */}
                <div
                  className="absolute w-[300px] h-[300px] rounded-full opacity-25 dark:opacity-12 animate-float"
                  style={{
                    background: 'radial-gradient(circle, color-mix(in oklch, var(--warning) 75%, transparent) 0%, transparent 70%)',
                    top: '40%',
                    right: '30%',
                    animationDuration: '35s',
                    animationDelay: '15s',
                    filter: 'blur(80px)',
                  }}
                />
              </div>

              {/* SVG noise texture for Mica/Acrylic effect */}
              <div
                className="absolute inset-0 opacity-[0.04] dark:opacity-[0.025] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4.2' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  backgroundSize: '200px 200px',
                  mixBlendMode: 'overlay',
                }}
              />
            </div>

            {/* Content with higher z-index */}
            <div className="relative z-10">
              <BrowserRouter>
                <Routes>
                  {/* Download Page */}
                  <Route path="/" element={<ReleasePage />} />
                  <Route path="/download" element={<ReleasePage />} />

                  {/* Changelog Page */}
                  <Route path="/changelog" element={<ChangelogPage />} />

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
            </div>
          </div>
        </LogoProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
