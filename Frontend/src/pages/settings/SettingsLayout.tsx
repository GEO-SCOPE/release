/**
 * Settings Layout - 设置页面布局
 * 顶部 Tab 导航 + 单列内容
 */

import { Outlet, Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { PageHeader } from "@/components/page-header"

const settingsTabs = [
  { key: "profile", href: "/settings/profile", labelKey: "settings.nav.profile" },
  { key: "plan", href: "/settings/plan", labelKey: "settings.nav.plan" },
  { key: "appearance", href: "/settings/appearance", labelKey: "settings.nav.appearance" },
  { key: "privacy", href: "/settings/privacy", labelKey: "settings.nav.privacy" },
  { key: "about", href: "/settings/about", labelKey: "settings.nav.about" },
]

export default function SettingsLayout() {
  const { t } = useI18n()
  const location = useLocation()

  const isActive = (href: string) => {
    if (href === "/settings/profile") {
      return location.pathname === "/settings" || location.pathname === "/settings/profile"
    }
    return location.pathname === href
  }

  return (
    <>
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      <div className="px-8">
        {/* 顶部 Tab 导航 */}
        <div className="border-b border-border">
          <nav className="flex gap-6">
            {settingsTabs.map((tab) => {
              const active = isActive(tab.href)
              return (
                <Link
                  key={tab.key}
                  to={tab.href}
                  className={cn(
                    "relative py-3 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(tab.labelKey)}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="py-8">
          <Outlet />
        </div>
      </div>
    </>
  )
}
