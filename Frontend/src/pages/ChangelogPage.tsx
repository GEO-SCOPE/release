/**
 * Changelog Page - 更新日志页面
 * 风格与 ReleasePage 一致
 */

import { useState, useEffect } from "react"
import { Moon, Sun, ChevronDown, User, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/theme-context"
import MetallicPaint, { parseLogoImage } from "@/components/reactbits/MetallicPaint"
import GlassSurface from "@/components/reactbits/GlassSurface"
import { releaseApi } from "@/lib/api/release"
import type { Changelog, ChangelogRelease } from "@/api/types"
import { RELEASE_SERVER_URL, RELEASE_DIRECTORY } from "@/config"

// 类型标签配置
const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  feature: { label: "New", color: "bg-emerald-500" },
  improve: { label: "Improved", color: "bg-blue-500" },
  fix: { label: "Fixed", color: "bg-amber-500" },
  breaking: { label: "Breaking", color: "bg-red-500" },
  security: { label: "Security", color: "bg-purple-500" },
  deprecated: { label: "Deprecated", color: "bg-zinc-500" },
}

export default function ChangelogPage() {
  const [logoImageData, setLogoImageData] = useState<ImageData | null>(null)
  const [changelog, setChangelog] = useState<Changelog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [locale] = useState<"en" | "zh">("en")

  const DEFAULT_SHOW_COUNT = 5
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // 加载 Logo for MetallicPaint
    const loadLogo = async () => {
      try {
        const response = await fetch("/logo.png")
        const blob = await response.blob()
        const file = new File([blob], "logo.png", { type: "image/png" })
        const result = await parseLogoImage(file)
        setLogoImageData(result.imageData)
      } catch (error) {
        console.error("Failed to load logo:", error)
      }
    }
    loadLogo()

    // 获取更新日志
    const fetchChangelog = async () => {
      try {
        const data = await releaseApi.getChangelog(50)
        setChangelog(data)
        // 默认展开第一个版本
        if (data.releases.length > 0) {
          setExpandedVersion(data.releases[0].version)
        }
      } catch (error) {
        console.error("Failed to fetch changelog:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchChangelog()
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const toggleVersion = (version: string) => {
    setExpandedVersion(expandedVersion === version ? null : version)
  }

  // 获取版本的作者列表
  const getAuthors = (release: ChangelogRelease) => {
    const authors = release.entries
      ?.map(e => e.author)
      .filter((author, idx, arr) =>
        author && arr.findIndex(a => a?.username === author.username) === idx
      ) || []

    if (authors.length === 0 && release.author) {
      return [release.author]
    }
    return authors
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950 flex flex-col">
      {/* 导航栏 */}
      <header className="px-6 py-4 border-b border-zinc-200/50 dark:border-zinc-800 backdrop-blur-sm bg-white/70 dark:bg-zinc-950/70">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="GEO-SCOPE"
              className="h-7 w-7"
              style={{
                filter: theme === "dark"
                  ? "brightness(0) invert(0.75) sepia(0.1) saturate(0.5)"
                  : "brightness(0) invert(0.35)"
              }}
            />
            <span className="font-semibold text-lg text-zinc-500 dark:text-zinc-100">GEO-SCOPE</span>
          </a>
          <nav className="hidden md:flex items-center gap-2 text-sm">
            {[
              { label: "Product", href: "/", active: false },
              { label: "Changelog", href: "/changelog", active: true },
              { label: "Docs", href: "#", active: false },
            ].map((item) => (
              item.active ? (
                theme === "dark" ? (
                  <GlassSurface
                    key={item.label}
                    width="auto"
                    height="auto"
                    borderRadius={16}
                    borderWidth={0.06}
                    brightness={45}
                    opacity={0.92}
                    blur={12}
                    backgroundOpacity={0.03}
                    isDark={true}
                    className="px-4 py-1.5"
                  >
                    <a href={item.href} className="text-zinc-100 font-medium">
                      {item.label}
                    </a>
                  </GlassSurface>
                ) : (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-white/50 backdrop-blur-xl px-4 py-1.5"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      boxShadow: `
                        0 0 0 1px rgba(0, 0, 0, 0.03),
                        0 2px 4px rgba(0, 0, 0, 0.04),
                        0 4px 8px rgba(0, 0, 0, 0.04),
                        inset 0 1px 0 0 rgba(255, 255, 255, 0.6),
                        inset 0 -1px 0 0 rgba(255, 255, 255, 0.3)
                      `
                    }}
                  >
                    <a href={item.href} className="text-zinc-900 font-medium">
                      {item.label}
                    </a>
                  </div>
                )
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {item.label}
                </a>
              )
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {/* Download Button */}
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Download
              <Download className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-12">
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          {/* Logo */}
          <div className="w-16 h-16 mx-auto mb-6">
            {logoImageData ? (
              <MetallicPaint
                imageData={logoImageData}
                params={{ patternScale: 2, refraction: 0.015, edge: 1, patternBlur: 0.005, liquid: 0.07, speed: 0.3 }}
              />
            ) : (
              <img
                src="/logo.png"
                alt="GEO-SCOPE"
                className="w-full h-full"
                style={{
                  filter: theme === "dark"
                    ? "brightness(0) invert(0.75) sepia(0.1) saturate(0.5)"
                    : "brightness(0)"
                }}
              />
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-medium text-zinc-900 dark:text-zinc-100 mb-4">
            Changelog
          </h1>

          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            New updates and improvements to GEO-SCOPE
          </p>
        </div>

        {/* Changelog List */}
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12 text-zinc-500">Loading...</div>
          ) : changelog?.releases.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">No releases yet</div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-zinc-200 dark:bg-zinc-800" />

              <div className="space-y-8">
                {(showAll ? changelog?.releases : changelog?.releases.slice(0, DEFAULT_SHOW_COUNT))?.map((release, releaseIdx) => {
                  const isExpanded = expandedVersion === release.version
                  const authors = getAuthors(release)
                  const versionDisplay = release.version.split('.').slice(0, 2).join('.')
                  const isFirst = releaseIdx === 0

                  return (
                    <div key={release.version} className="relative pl-8">
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950",
                        isFirst ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
                      )} />

                      {/* Version Header */}
                      <div
                        className="cursor-pointer group"
                        onClick={() => toggleVersion(release.version)}
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                            v{versionDisplay}
                          </span>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            {release.date}
                          </span>
                          {/* Authors */}
                          {authors.length > 0 && (
                            <div className="flex -space-x-1.5 ml-auto">
                              {authors.slice(0, 3).map((author) => (
                                <div
                                  key={author!.username}
                                  className="h-6 w-6 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-200 dark:bg-zinc-800 overflow-hidden"
                                  title={author!.name}
                                >
                                  {author!.avatar_url ? (
                                    <img
                                      src={`${RELEASE_SERVER_URL}${RELEASE_DIRECTORY}${author!.avatar_url}`}
                                      alt={author!.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <User className="h-3 w-3 text-zinc-400" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <ChevronDown className={cn(
                            "h-5 w-5 text-zinc-400 transition-transform",
                            isExpanded ? "rotate-180" : ""
                          )} />
                        </div>

                        {/* Preview when collapsed */}
                        {!isExpanded && release.changes.length > 0 && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
                            {locale === "zh" ? release.changes[0]?.text_zh : release.changes[0]?.text_en}
                            {release.changes.length > 1 && ` and ${release.changes.length - 1} more updates`}
                          </p>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          {(release.entries || release.changes).map((entry, idx) => {
                            const isEntry = 'title_zh' in entry
                            const title = isEntry
                              ? (locale === "zh" ? (entry as any).title_zh : (entry as any).title_en)
                              : (locale === "zh" ? entry.text_zh : entry.text_en)
                            const type = entry.type || "improve"
                            const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.improve

                            return (
                              <div
                                key={idx}
                                className="flex items-start gap-3 py-2"
                              >
                                {/* Type indicator */}
                                <div className={cn(
                                  "mt-1.5 w-2 h-2 rounded-full shrink-0",
                                  typeConfig.color
                                )} />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                      {typeConfig.label}
                                    </span>
                                  </div>
                                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">
                                    {title}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Show All Button */}
              {!showAll && changelog && changelog.releases.length > DEFAULT_SHOW_COUNT && (
                <div className="relative pl-8 pt-4">
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  >
                    Show all {changelog.releases.length} releases
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <span>&copy; 2026 GEO-SCOPE</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
