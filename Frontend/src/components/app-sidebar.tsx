import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboardIcon,
  TrendingUpIcon,
  SettingsIcon,
  PanelLeftIcon,
  UsersIcon,
  HelpCircleIcon,
  PlayIcon,
  BoxIcon,
  MessagesSquareIcon,
} from "@/components/icons"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { useTheme } from "@/lib/theme-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRBSidebar } from "@/components/reactbits/sidebar"
import { useProjectStore } from "@/store/project-store"
import { Button } from "@/components/ui/button"
import { normalizeAvatarUrl } from "@/lib/api/user"

export function AppSidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const { t } = useI18n()
  const { resolvedTheme } = useTheme()
  const { collapsed, toggle } = useRBSidebar()
  const currentUser = useProjectStore((state) => state.currentUser)
  const isLight = resolvedTheme === "light"

  // =====================================================
  // Navigation Items (plan.md 2025-12-22 更新)
  // B2B SaaS: 删除项目管理，1 客户 = 1 Project
  // =====================================================
  const navigation = [
    {
      name: t("nav.dashboard"),
      href: "/",
      icon: LayoutDashboardIcon,
    },
    {
      name: t("nav.assets"),
      href: "/assets",
      icon: BoxIcon,
    },
    {
      name: t("nav.personas"),
      href: "/personas",
      icon: UsersIcon,
    },
    {
      name: t("nav.benchmarks"),
      href: "/benchmarks",
      icon: HelpCircleIcon,
    },
    {
      name: t("nav.runCenter"),
      href: "/run-center",
      icon: PlayIcon,
    },
    {
      name: t("nav.workspace"),
      href: "/workspace",
      icon: MessagesSquareIcon,
    },
    {
      name: t("nav.optimize"),
      href: "/optimize",
      icon: TrendingUpIcon,
    },
    {
      name: t("nav.settings"),
      href: "/settings",
      icon: SettingsIcon,
    },
  ]
  // =====================================================
  // Legacy Navigation Items (commented out per plan.md)
  // =====================================================
  // { name: t("nav.citations"), href: "/citations", icon: FileTextIcon },  // Merged into Workspace
  // { name: t("nav.questions"), href: "/questions", icon: HelpCircleIcon },  // Renamed to benchmarks

  return (
    <div
      className="flex h-full w-full flex-col border-r relative overflow-hidden"
      style={{
        backgroundColor: 'var(--colorNeutralBackground2)',
        borderColor: 'var(--colorNeutralStroke2)',
      }}
    >
      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col">
        {/* Logo */}
        <div
          className={cn(
            "flex h-14 items-center justify-between border-b border-sidebar-border transition-all",
            collapsed ? "px-2 cursor-pointer hover:bg-sidebar-accent" : "px-4"
          )}
          onClick={collapsed ? toggle : undefined}
        >
          <div className={cn(
            "flex items-center gap-3 flex-1 min-w-0",
            collapsed && "justify-center"
          )}>
            <div className={cn("relative h-[22px] w-[22px] flex-shrink-0",
              collapsed ? "" : "ml-3"
            )}>
              <img
                src="/logo.png"
                alt="GEO-SCOPE Logo"
                className="h-full w-full object-contain"
                style={{
                  filter: isLight
                    ? 'brightness(0) opacity(0.65)'
                    : 'brightness(0) invert(1) opacity(0.85)'
                }}
              />
            </div>
            {!collapsed && (
              <span className="text-base font-semibold whitespace-nowrap overflow-hidden text-sidebar-foreground">
                GEO-SCOPE
              </span>
            )}
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                toggle()
              }}
              className="flex-shrink-0"
              title="Collapse sidebar"
            >
              <PanelLeftIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto overscroll-y-contain",
          collapsed ? "space-y-2 p-2 flex flex-col items-center" : "space-y-1 p-4"
        )}>
          {navigation.map((item) => {
            // 使用前缀匹配，但根路径需要精确匹配
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "group relative flex items-center text-sm font-medium fluent-transition overflow-hidden",
                  collapsed
                    ? "justify-center w-10 h-10 rounded-full"
                    : "gap-3 px-3 py-2.5 rounded-xl",
                  isActive
                    ? isLight
                      ? "bg-white/70 border border-black/[0.08] shadow-sm text-primary"
                      : "text-primary border border-white/[0.1]"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
                style={isActive && !isLight ? {
                  boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
                } : undefined}
              >
                {/* Dark mode: Glassmorphism layers for active state */}
                {isActive && !isLight && (
                  <>
                    {/* Backdrop blur */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backdropFilter: 'blur(12px) saturate(140%)',
                        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                        borderRadius: 'inherit',
                      }}
                    />
                    {/* Tint overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundColor: 'rgba(var(--acrylic-tint), 0.35)',
                        borderRadius: 'inherit',
                      }}
                    />
                    {/* Luminosity gradient */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
                        borderRadius: 'inherit',
                      }}
                    />
                  </>
                )}
                {/* Content */}
                <item.icon className={cn("h-5 w-5 flex-shrink-0 relative z-10", !collapsed && "ml-3")} />
                {!collapsed && <span className="relative z-10">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer - Controls & User Profile */}
        <div className={cn(
          "flex flex-col border-t border-sidebar-border",
          collapsed ? "items-center gap-2 py-3" : "gap-2 p-4"
        )}>
          {/* Theme Toggle */}
          <ThemeToggle collapsed={collapsed} />

          {/* User Profile */}
          {currentUser && (
            <Link
              to="/settings/profile"
              title={collapsed ? currentUser.name : undefined}
              className={cn(
                "flex items-center fluent-transition cursor-pointer",
                collapsed
                  ? "justify-center w-10 h-10 rounded-full hover:bg-sidebar-accent"
                  : "gap-3 p-2 rounded-lg hover:bg-sidebar-accent mt-1"
              )}
            >
              {currentUser.avatar ? (
                <img
                  src={normalizeAvatarUrl(currentUser.avatar)}
                  alt={currentUser.name}
                  className={cn(
                    "rounded-full object-cover flex-shrink-0",
                    collapsed ? "h-6 w-6" : "h-8 w-8"
                  )}
                />
              ) : (
                <div className={cn(
                  "rounded-full bg-primary/80 flex items-center justify-center font-semibold text-white flex-shrink-0",
                  collapsed ? "h-6 w-6 text-[11px]" : "h-8 w-8 text-xs"
                )}>
                  {currentUser.company_name.charAt(0)}
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                </div>
              )}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
