/**
 * Software Release Page - Clean Download Page
 * 参考 Google Antigravity 下载页风格
 */

import { useState, useEffect, useMemo } from "react"
import { Download, Moon, Sun, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/theme-context"
import MetallicPaint, { parseLogoImage } from "@/components/reactbits/MetallicPaint"
import GlassSurface from "@/components/reactbits/GlassSurface"
import TextType from "@/components/reactbits/typetext"
import { releaseApi, type ReleaseWithBuilds } from "@/lib/api/release"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// Platform icons - 更大尺寸用于卡片
const PlatformIcon = ({ platform, className }: { platform: string; className?: string }) => {
  if (platform === "linux") {
    return <img src="/platforms/linux-logo.png" alt="Linux" className={cn("h-8 w-8 dark:invert", className)} />
  }

  const icons: Record<string, JSX.Element> = {
    windows: (
      <svg viewBox="0 0 24 24" className={cn("h-8 w-8", className)} fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
      </svg>
    ),
    macos: (
      <svg viewBox="0 0 24 24" className={cn("h-8 w-8", className)} fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  }
  return icons[platform] || null
}

// 平台配置
const PLATFORM_CONFIG = {
  macos: {
    name: "macOS",
    target: "darwin",
    requirements: "macOS 12 (Monterey) or later. Apple Silicon recommended.",
    archLabels: {
      aarch64: "Download for Apple Silicon",
      x86_64: "Download for Intel",
    },
  },
  windows: {
    name: "Windows",
    target: "windows",
    requirements: "Windows 10 (64 bit) or later.",
    archLabels: {
      x86_64: "Download for x64",
      aarch64: "Download for ARM64",
    },
  },
  linux: {
    name: "Linux",
    target: "linux",
    requirements: "glibc >= 2.28 (e.g. Ubuntu 20, Debian 10, Fedora 36).",
    archLabels: {
      x86_64: "Download for x64",
      aarch64: "Download for ARM64",
    },
  },
} as const

type PlatformKey = keyof typeof PLATFORM_CONFIG

// 检测用户平台
const detectPlatform = (): "macos" | "windows" | "linux" => {
  if (typeof navigator === "undefined") return "macos"
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes("mac")) return "macos"
  if (ua.includes("win")) return "windows"
  return "linux"
}

// 下载信息类型
interface DownloadInfo {
  filename: string
  url: string
  platform: string
}

export default function ReleasePage() {
  // 使用惰性初始化直接检测平台，避免初次渲染后的状态变化导致闪烁
  const [currentPlatform, setCurrentPlatform] = useState<PlatformKey>(() => detectPlatform())
  const [logoImageData, setLogoImageData] = useState<ImageData | null>(null)
  const [latestRelease, setLatestRelease] = useState<ReleaseWithBuilds | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [currentDownload, setCurrentDownload] = useState<DownloadInfo | null>(null)
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

    // 获取最新版本信息
    const fetchLatestRelease = async () => {
      try {
        const release = await releaseApi.getLatestRelease()
        setLatestRelease(release)
      } catch (error) {
        console.error("Failed to fetch latest release:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLatestRelease()
  }, [])

  // 根据平台获取可用的下载选项
  const getDownloadOptions = useMemo(() => {
    return (platform: PlatformKey) => {
      const config = PLATFORM_CONFIG[platform]
      if (!latestRelease) return []

      return latestRelease.builds
        .filter(build => build.target === config.target)
        .map(build => {
          const url = releaseApi.getDownloadUrl(latestRelease, build.target, build.arch) || "#"
          // 从 URL 中提取文件名
          const filename = build.url.split('/').pop() || ''
          return {
            label: config.archLabels[build.arch as keyof typeof config.archLabels] || `Download for ${build.arch}`,
            arch: build.arch,
            url,
            filename,
          }
        })
    }
  }, [latestRelease])

  const handleDownload = (url: string, filename?: string, platform?: string) => {
    if (url && url !== "#") {
      // 设置下载信息并显示弹窗
      setCurrentDownload({
        filename: filename || url.split('/').pop() || 'file',
        url,
        platform: platform || PLATFORM_CONFIG[currentPlatform].name,
      })
      setDownloadDialogOpen(true)
      // 触发下载
      window.location.href = url
    }
  }

  // 获取当前平台的首选下载信息
  const getPrimaryDownload = (platform: PlatformKey) => {
    const options = getDownloadOptions(platform)
    // 优先选择 aarch64 (Apple Silicon / ARM)
    const preferred = options.find(o => o.arch === "aarch64") || options[0]
    return preferred || null
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950 flex flex-col">
      {/* 导航栏 */}
      <header className="px-6 py-4 border-b border-zinc-200/50 dark:border-zinc-800 backdrop-blur-sm bg-white/70 dark:bg-zinc-950/70">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          </div>
          <nav className="hidden md:flex items-center gap-2 text-sm">
            {[
              { label: "Product", href: "/", active: true },
              { label: "Changelog", href: "/changelog", active: false },
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
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {/* Download Button */}
            <button
              onClick={() => {
                const download = getPrimaryDownload(currentPlatform)
                if (download) handleDownload(download.url, download.filename, PLATFORM_CONFIG[currentPlatform].name)
              }}
              disabled={isLoading || !latestRelease}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - 填充剩余空间 */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12 animate-in fade-in duration-300">
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          {/* Logo - MetallicPaint with fade transition */}
          <div className="w-20 h-20 mx-auto mb-8 relative">
            {/* Fallback static logo - fades out when MetallicPaint is ready */}
            <img
              src="/logo.png"
              alt="GEO-SCOPE"
              className="w-full h-full absolute inset-0 transition-opacity duration-500"
              style={{
                filter: theme === "dark"
                  ? "brightness(0) invert(0.75) sepia(0.1) saturate(0.5)"
                  : "brightness(0)",
                opacity: logoImageData ? 0 : 1,
              }}
            />
            {/* MetallicPaint - fades in when ready */}
            <div
              className="w-full h-full transition-opacity duration-500"
              style={{ opacity: logoImageData ? 1 : 0 }}
            >
              {logoImageData && (
                <MetallicPaint
                  imageData={logoImageData}
                  params={{ patternScale: 2, refraction: 0.015, edge: 1, patternBlur: 0.005, liquid: 0.07, speed: 0.3 }}
                />
              )}
            </div>
          </div>

          {/* Title */}
          <TextType
            text="Download GEO-SCOPE"
            as="h1"
            className="text-4xl md:text-5xl font-medium text-zinc-900 dark:text-zinc-100 mb-6"
            typingSpeed={80}
            loop={false}
            showCursor={true}
            hideCursorOnComplete={true}
            cursorCharacter="|"
            cursorClassName="text-zinc-900 dark:text-zinc-100"
          />

          {/* Platform + Download Button */}
          <div className="flex items-center justify-center gap-4">
            <span className="text-2xl md:text-3xl text-zinc-400 dark:text-zinc-500">
              for {PLATFORM_CONFIG[currentPlatform].name}
            </span>
            <button
              onClick={() => {
                const download = getPrimaryDownload(currentPlatform)
                if (download) handleDownload(download.url, download.filename, PLATFORM_CONFIG[currentPlatform].name)
              }}
              disabled={isLoading || !latestRelease}
              className="flex items-center justify-center gap-2 px-5 py-2.5 min-w-[180px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-base font-medium rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5 flex-shrink-0" />
              <span className="transition-opacity duration-200">
                {isLoading ? "Loading..." : latestRelease ? `Download v${latestRelease.version}` : "Download"}
              </span>
            </button>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["macos", "windows", "linux"] as const).map((platform) => {
              const config = PLATFORM_CONFIG[platform]
              const options = getDownloadOptions(platform)
              const isActive = platform === currentPlatform
              const hasBuilds = options.length > 0

              const cardContent = (
                <div className="flex flex-col w-full">
                  {/* Platform Icon */}
                  <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                    <PlatformIcon platform={platform} className="text-zinc-700 dark:text-zinc-300" />
                  </div>

                  {/* Platform Name */}
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                    {config.name}
                  </h3>

                  {/* Download Links */}
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="text-sm text-zinc-400 dark:text-zinc-500">Loading...</div>
                    ) : hasBuilds ? (
                      options.map((option, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(option.url, option.filename, config.name)
                          }}
                          className="w-full flex items-center justify-between py-2 px-3 -mx-3 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors group"
                        >
                          <span className="truncate">
                            <span className="group-hover:hidden">{option.label}</span>
                            <span className="hidden group-hover:inline" title={option.filename}>{option.filename}</span>
                          </span>
                          <Download className="h-4 w-4 flex-shrink-0 ml-2 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-zinc-400 dark:text-zinc-500">Coming soon</div>
                    )}
                  </div>
                </div>
              )

              if (isActive) {
                return (
                  <GlassSurface
                    key={platform}
                    width="100%"
                    height="auto"
                    borderRadius={16}
                    borderWidth={0.06}
                    brightness={theme === "dark" ? 45 : 98}
                    opacity={0.92}
                    blur={12}
                    backgroundOpacity={theme === "dark" ? 0.03 : 0.5}
                    isDark={theme === "dark"}
                    className="p-6 cursor-pointer ring-2 ring-primary"
                    onClick={() => setCurrentPlatform(platform)}
                  >
                    {cardContent}
                  </GlassSurface>
                )
              }

              return (
                <div
                  key={platform}
                  onClick={() => setCurrentPlatform(platform)}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 cursor-pointer transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                >
                  {cardContent}
                </div>
              )
            })}
          </div>

          {/* Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {(["macos", "windows", "linux"] as const).map((platform) => (
              <div key={platform} className="text-sm">
                <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Minimum Requirements
                </h4>
                <p className="text-zinc-500 dark:text-zinc-500 text-xs leading-relaxed">
                  {PLATFORM_CONFIG[platform].requirements}
                </p>
              </div>
            ))}
          </div>
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

      {/* Download Started Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-xl">Download Started</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              Thank you for downloading GEO-SCOPE for {currentDownload?.platform}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* File info */}
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">File</div>
              <div className="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">
                {currentDownload?.filename}
              </div>
            </div>

            {/* Manual download link */}
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              If your download didn't start automatically,{" "}
              <a
                href={currentDownload?.url}
                className="text-primary hover:underline font-medium"
                onClick={() => setDownloadDialogOpen(false)}
              >
                click here to download
              </a>.
            </div>

            {/* Installation hint */}
            <div className="text-xs text-zinc-500 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-700 pt-3">
              {currentDownload?.platform === "macOS" && (
                <>Open the .dmg file and drag GEO-SCOPE to your Applications folder.</>
              )}
              {currentDownload?.platform === "Windows" && (
                <>Run the installer and follow the on-screen instructions.</>
              )}
              {currentDownload?.platform === "Linux" && (
                <>Extract the archive and run the executable, or use your package manager.</>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
