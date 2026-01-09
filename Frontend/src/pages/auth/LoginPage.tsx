/**
 * GEO-SCOPE Login Page
 * Uses GridScan background with app theme colors
 */

import { useState, useEffect, type CSSProperties, type SVGProps } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { GridScan } from "@/components/reactbits/BgGridScan"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useTheme } from "@/lib/theme-context"
import { useAccentColor, ACCENT_COLORS } from "@/lib/accent-color"
import { useI18n, type Locale } from "@/lib/i18n"
import { localeNames } from "@/lib/i18n/types"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "@/components/icons"
import { authApi, ApiError } from "@/api"
import { useAuthStore, isLoggedIn } from "@/store/auth-store"

export default function LoginPage() {
  const navigate = useNavigate()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { locale, setLocale, t } = useI18n()
  const { accentColor, secondaryColor } = useAccentColor()
  const isDark = resolvedTheme === "dark"
  const setToken = useAuthStore((state) => state.setToken)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/", { replace: true })
    }
  }, [navigate])

  const accentTokens = ACCENT_COLORS[accentColor]
  const secondaryTokens = ACCENT_COLORS[secondaryColor]

  // Theme token values needed immediately by this page.
  const scanColor = isDark ? accentTokens.hexDark : accentTokens.hexLight
  const secondaryHex = isDark ? secondaryTokens.hexDark : secondaryTokens.hexLight
  type CssVarStyles = CSSProperties & Record<`--${string}`, string>

  const loginThemeStyles: CssVarStyles = {
    "--primary": isDark ? accentTokens.dark : accentTokens.light,
    "--primary-hover": accentTokens.hover,
    "--primary-active": isDark
      ? `oklch(from ${accentTokens.dark} calc(l - 0.04) c h)`
      : `oklch(from ${accentTokens.light} calc(l - 0.04) c h)`,
    "--secondary-accent": isDark ? secondaryTokens.dark : secondaryTokens.light,
    "--color-primary": isDark ? accentTokens.dark : accentTokens.light,
    "--color-secondary": isDark ? secondaryTokens.dark : secondaryTokens.light,
  }

  // Grid lines use the secondary accent; opacity differs by theme for better layering.
  const gridLinesColor = isDark ? secondaryTokens.hexDark : secondaryTokens.hexLight

  const themeOrder: Array<"light" | "dark" | "system"> = ["light", "dark", "system"]
  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme)
    const next = themeOrder[(currentIndex + 1) % themeOrder.length]
    setTheme(next)
  }

  // All available locales for dropdown
  const availableLocales = Object.keys(localeNames) as Locale[]

  const themeLabel = theme === "system" ? "Auto" : theme === "light" ? "Light" : "Dark"
  const ThemeIcon = resolvedTheme === "dark" ? MoonGlyph : SunGlyph

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // 前端验证
    if (!email || !password) {
      setError(t("login.error.missingFields"))
      return
    }

    setIsLoading(true)

    try {
      // 调用登录 API
      const response = await authApi.login(email, password)

      // 存储 token 到 auth store
      setToken(response.token, response.refresh_token, response.expires_in)

      // 登录成功，跳转到首页
      navigate("/", { replace: true })
    } catch (err) {
      // 处理错误
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError(t("login.error.invalidCredentials"))
        } else if (err.status === 404) {
          setError(t("login.error.userNotFound"))
        } else {
          setError(err.message || t("login.error.generic"))
        }
      } else {
        setError(err instanceof Error ? err.message : t("login.error.generic"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // GridScan 使用主题色，调整参数使视觉效果更柔和
  const gridScanProps = isDark
    ? {
        linesColor: gridLinesColor,
        scanColor: scanColor,
        gridScale: 0.08,
        scanOpacity: 0.5,
        bloomIntensity: 0.7,
        noiseIntensity: 0.015,
      }
    : {
        linesColor: gridLinesColor,
        scanColor: scanColor,
        gridScale: 0.08,
        scanOpacity: 0.35,
        bloomIntensity: 0.5,
        noiseIntensity: 0.008,
      }

  // 背景渐变色：填充中心透视区域，消除黑色空洞
  const centerFill = isDark
    ? `radial-gradient(ellipse 100% 80% at 50% 55%, ${secondaryHex}25 0%, ${scanColor}15 50%, transparent 80%)`
    : `radial-gradient(ellipse 100% 80% at 50% 55%, ${secondaryHex}18 0%, ${scanColor}10 50%, transparent 80%)`

  const bgGradient = isDark
    ? `${centerFill},
       radial-gradient(ellipse at 50% 30%, ${scanColor}1a 0%, transparent 50%),
       radial-gradient(ellipse at 80% 80%, ${secondaryHex}12 0%, transparent 40%)`
    : `${centerFill},
       radial-gradient(ellipse at 50% 30%, ${scanColor}18 0%, transparent 50%),
       radial-gradient(ellipse at 80% 80%, ${secondaryHex}0f 0%, transparent 40%)`

  // 用于强制 GridScan 重新渲染的 key
  const gridScanKey = `${accentColor}-${secondaryColor}-${isDark ? 'dark' : 'light'}`

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-background"
      style={loginThemeStyles}
    >
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 text-xs">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={cycleTheme}
          className="h-8 rounded-full bg-background/80 px-3 text-xs font-medium backdrop-blur"
          aria-label="Toggle theme"
        >
          <ThemeIcon className="mr-1 h-3.5 w-3.5" />
          {themeLabel}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full bg-background/80 px-3 text-xs font-semibold backdrop-blur"
              aria-label="Select language"
            >
              {localeNames[locale]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            {availableLocales.map((loc) => (
              <DropdownMenuItem
                key={loc}
                onClick={() => setLocale(loc)}
                className={locale === loc ? "bg-accent" : ""}
              >
                {localeNames[loc]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* 主题色渐变背景层 */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: bgGradient }}
      />

      {/* GridScan Background */}
      <div className="absolute inset-0 z-[1]">
        <GridScan
          key={gridScanKey}
          sensitivity={0.5}
          lineThickness={1}
          enablePost
          chromaticAberration={0.001}
          scanDuration={3}
          scanDelay={1.5}
          scanDirection="pingpong"
          scanSoftness={2.5}
          scanGlow={0.6}
          {...gridScanProps}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Logo & Title - 参考 sidebar 风格 */}
          <div className="mb-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mx-auto mb-4 flex items-center justify-center gap-3"
            >
              <div className="relative h-8 w-8 flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="GEO-SCOPE Logo"
                  className="h-full w-full object-contain"
                  style={{
                    filter: isDark
                      ? 'brightness(0) invert(1) opacity(0.9)'
                      : 'brightness(0) opacity(0.7)'
                  }}
                />
              </div>
              <span className="text-2xl font-semibold text-foreground">
                GEO-SCOPE
              </span>
            </motion.div>
            <p className="text-sm text-muted-foreground">
              {t("login.title")}
            </p>
          </div>

          {/* Login Form - 简洁无 card */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">{t("login.email")}</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder={t("login.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-background/80 backdrop-blur-md border-border/60 focus:border-primary focus:bg-background/90 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">{t("login.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-11 bg-background/80 backdrop-blur-md border-border/60 focus:border-primary focus:bg-background/90 transition-colors"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 rounded-md bg-background/70 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isLoading}
                />
                <label htmlFor="remember" className="cursor-pointer select-none">
                  {t("login.rememberMe")}
                </label>
              </div>
              <a
                href="#"
                className="rounded-md bg-background/70 px-3 py-1.5 text-sm text-primary backdrop-blur-sm transition-colors hover:bg-background/90 hover:text-primary-hover"
                onClick={(e) => e.preventDefault()}
              >
                {t("login.forgotPassword")}
              </a>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button - 使用主配色 */}
            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {t("login.signingIn")}
                </>
              ) : (
                t("login.signIn")
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="rounded-full bg-background/70 px-5 py-1.5 text-muted-foreground backdrop-blur-sm">
                {t("login.divider")}
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              className="h-11 bg-background/80 backdrop-blur-md border-border/60 hover:bg-background/90 hover:border-border transition-colors"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("login.google")}
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              className="h-11 bg-background/80 backdrop-blur-md border-border/60 hover:bg-background/90 hover:border-border transition-colors"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
              {t("login.apple")}
            </Button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t("login.noAccount")} {" "}
            <a href="#" className="text-primary hover:text-primary-hover hover:underline font-medium transition-colors">
              {t("login.contactSales")}
            </a>
          </p>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground/60">
            {t("login.agreement")}{" "}
            <a href="#" className="hover:text-muted-foreground hover:underline">{t("login.terms")}</a>
            {" "}{t("login.and")} {" "}
            <a href="#" className="hover:text-muted-foreground hover:underline">{t("login.privacy")}</a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function SunGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 7.07-1.41-1.41M6.34 6.34 4.93 4.93m0 14.14 1.41-1.41m11.32-11.32 1.41-1.41" />
    </svg>
  )
}

function MoonGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  )
}
