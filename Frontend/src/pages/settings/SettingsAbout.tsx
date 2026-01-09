/**
 * Settings About - 关于软件
 * 版本、更新日志、帮助文档、反馈入口
 * 数据来源：systemApi
 *
 * 彩蛋：双击版本号可以输入 Beta 测试密钥
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Info,
  ExternalLink,
  MessageSquare,
  FileText,
  History,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  FlaskConical,
  X,
  ChevronRight,
  User,
  Bug,
  ImagePlus,
  Trash2,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"
import { systemApi, releaseApi } from "@/api"
import type { AppInfo, Changelog, ChangelogRelease } from "@/api"
import { RELEASE_SERVER_URL, RELEASE_DIRECTORY } from "@/config"
import { useUpdater } from "@/hooks/useUpdater"
import { useTauriInfo } from "@/hooks/useTauriInfo"
import { cn } from "@/lib/utils"

export default function SettingsAbout() {
  const { t, locale } = useI18n()
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [changelog, setChangelog] = useState<Changelog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 本地版本信息（Tauri 和 Web 都从构建时常量获取）
  const { info: localInfo, isTauriEnv } = useTauriInfo()

  // 显示的版本和构建日期（优先使用本地构建时的值）
  const displayVersion = localInfo?.version || appInfo?.version || "0.0.0"
  const displayBuildDate = localInfo?.buildDate || appInfo?.build_date || "-"

  // Beta 密钥弹窗状态
  const [betaDialogOpen, setBetaDialogOpen] = useState(false)
  const [betaKeyInput, setBetaKeyInput] = useState("")
  const [isValidating, setIsValidating] = useState(false)

  // 版本详情弹窗状态
  const [selectedRelease, setSelectedRelease] = useState<ChangelogRelease | null>(null)

  // 更新日志展开状态
  const [changelogExpanded, setChangelogExpanded] = useState(false)
  const CHANGELOG_COLLAPSED_COUNT = 3

  // Bug 报告弹窗状态
  const [bugDialogOpen, setBugDialogOpen] = useState(false)
  const [bugTitle, setBugTitle] = useState("")
  const [bugDescription, setBugDescription] = useState("")
  const [bugSteps, setBugSteps] = useState("")
  const [bugEmail, setBugEmail] = useState("")
  const [bugScreenshots, setBugScreenshots] = useState<File[]>([])
  const [isSubmittingBug, setIsSubmittingBug] = useState(false)

  const {
    status,
    progress,
    downloadedBytes,
    totalBytes,
    updateInfo,
    lastCheckedAt,
    autoCheckEnabled,
    isChecking,
    isDownloading,
    hasUpdate,
    isReady,
    isBetaChannel,
    checkForUpdates,
    downloadAndInstall,
    restartApp,
    setAutoCheckEnabled,
    validateBetaKey,
    leaveBetaChannel,
  } = useUpdater()

  // 双击版本号打开 Beta 密钥弹窗
  const handleVersionDoubleClick = () => {
    setBetaDialogOpen(true)
    setBetaKeyInput("")
  }

  // 验证 Beta 密钥
  const handleValidateBetaKey = async () => {
    if (!betaKeyInput.trim()) return

    setIsValidating(true)
    const success = await validateBetaKey(betaKeyInput.trim())
    setIsValidating(false)

    if (success) {
      setBetaDialogOpen(false)
      setBetaKeyInput("")
    }
  }

  // 退出 Beta 通道
  const handleExitBeta = () => {
    leaveBetaChannel()
    setBetaDialogOpen(false)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t('settings.about.update.never')
    return new Date(dateStr).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')
  }

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return t('settings.about.update.upToDate')
      case 'checking':
        return t('settings.about.update.checking')
      case 'available':
        return t('settings.about.update.available').replace('{version}', updateInfo?.version || '')
      case 'downloading':
        return t('settings.about.update.downloading')
      case 'ready':
        return t('settings.about.update.ready')
      case 'error':
        return t('settings.about.update.error')
      default:
        return ''
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // 从主 Backend 获取应用信息，从 Release 服务器获取更新日志
        const [infoResult, changelogResult] = await Promise.all([
          systemApi.getAppInfo(),
          releaseApi.getChangelog(),
        ])
        setAppInfo(infoResult)
        setChangelog(changelogResult)
      } catch (error) {
        console.error("Failed to fetch system info:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleFeedback = () => {
    window.open(appInfo?.github_url || "https://github.com/geo-scope/geo-scope/issues", "_blank")
  }

  const handleDocs = () => {
    if (appInfo?.docs_url) {
      window.open(appInfo.docs_url, "_blank")
    } else {
      toast.info(t("settings.about.docsComingSoon"))
    }
  }

  // Bug 报告相关函数
  const resetBugForm = () => {
    setBugTitle("")
    setBugDescription("")
    setBugSteps("")
    setBugEmail("")
    setBugScreenshots([])
  }

  const handleBugScreenshotAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        toast.error(t("settings.about.bug.invalidFileType"))
        return false
      }
      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("settings.about.bug.fileTooLarge"))
        return false
      }
      return true
    })

    if (bugScreenshots.length + newFiles.length > 5) {
      toast.error(t("settings.about.bug.maxScreenshots"))
      return
    }

    setBugScreenshots(prev => [...prev, ...newFiles])
    // 清空 input 以便重复选择相同文件
    e.target.value = ''
  }

  const handleBugScreenshotRemove = (index: number) => {
    setBugScreenshots(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitBug = async () => {
    // 验证
    if (bugTitle.trim().length < 5) {
      toast.error(t("settings.about.bug.titleTooShort"))
      return
    }
    if (bugDescription.trim().length < 10) {
      toast.error(t("settings.about.bug.descriptionTooShort"))
      return
    }

    setIsSubmittingBug(true)

    try {
      const result = await releaseApi.submitBugReport({
        title: bugTitle.trim(),
        description: bugDescription.trim(),
        stepsToReproduce: bugSteps.trim() || undefined,
        appVersion: displayVersion,
        platform: isTauriEnv ? (navigator.platform.includes('Mac') ? 'darwin' : navigator.platform.includes('Win') ? 'windows' : 'linux') : 'web',
        osVersion: navigator.userAgent,
        contactEmail: bugEmail.trim() || undefined,
        screenshots: bugScreenshots.length > 0 ? bugScreenshots : undefined,
      })

      if (result.success) {
        toast.success(t("settings.about.bug.submitSuccess"))
        setBugDialogOpen(false)
        resetBugForm()
      } else {
        toast.error(result.message || t("settings.about.bug.submitFailed"))
      }
    } catch (error) {
      console.error('Failed to submit bug report:', error)
      toast.error(t("settings.about.bug.submitFailed"))
    } finally {
      setIsSubmittingBug(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 产品信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            {t("settings.about.productInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <img
                src={appInfo?.logo_url || "/logo.png"}
                alt={`${appInfo?.name || "GEO-SCOPE"} Logo`}
                className="h-10 w-10 object-contain dark:brightness-0 dark:invert"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold">{appInfo?.name || "GEO-SCOPE"}</h3>
              <p className="text-sm text-muted-foreground">
                {locale === "zh" ? appInfo?.tagline_zh : appInfo?.tagline_en}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground">{t("settings.about.version")}</p>
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "font-mono",
                    isTauriEnv && "cursor-default select-none"
                  )}
                  onDoubleClick={isTauriEnv ? handleVersionDoubleClick : undefined}
                  title={isTauriEnv ? t("settings.about.beta.hint") : undefined}
                >
                  v{displayVersion}
                </p>
                {/* Beta 标签仅在 Tauri 环境显示 */}
                {isTauriEnv && isBetaChannel && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <FlaskConical className="h-3 w-3" />
                    Beta
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("settings.about.buildDate")}</p>
              <p className="font-mono">{displayBuildDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 软件更新 */}
      {isTauriEnv && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t("settings.about.update.title")}
            </CardTitle>
            <CardDescription>{t("settings.about.update.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 更新状态显示 */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {status === 'idle' && <CheckCircle2 className="h-8 w-8 text-green-500" />}
                {status === 'checking' && <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />}
                {status === 'available' && <Download className="h-8 w-8 text-primary" />}
                {status === 'downloading' && <Loader2 className="h-8 w-8 text-primary animate-spin" />}
                {status === 'ready' && <RotateCcw className="h-8 w-8 text-green-500" />}
                {status === 'error' && <AlertCircle className="h-8 w-8 text-destructive" />}

                <div>
                  <p className="font-medium">{getStatusText()}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.about.update.lastChecked")}: {formatDate(lastCheckedAt)}
                  </p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                {(status === 'idle' || status === 'error') && (
                  <Button
                    variant="outline"
                    onClick={() => checkForUpdates(false)}
                    disabled={isChecking}
                  >
                    <RefreshCw className={cn("mr-2 h-4 w-4", isChecking && "animate-spin")} />
                    {t("settings.about.update.checkNow")}
                  </Button>
                )}

                {hasUpdate && (
                  <Button onClick={downloadAndInstall}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("settings.about.update.downloadAndInstall")}
                  </Button>
                )}

                {isReady && (
                  <Button onClick={restartApp}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t("settings.about.update.restartNow")}
                  </Button>
                )}
              </div>
            </div>

            {/* 下载进度 */}
            {isDownloading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("settings.about.update.downloadProgress")}</span>
                  <span>{formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">{progress}%</p>
              </div>
            )}

            {/* 新版本信息 */}
            {updateInfo && hasUpdate && (
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">v{updateInfo.version}</Badge>
                  <span className="text-sm text-muted-foreground">{updateInfo.date}</span>
                </div>
                {updateInfo.notes && (
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {updateInfo.notes}
                  </pre>
                )}
              </div>
            )}

            {/* 自动更新设置 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <p className="font-medium">{t("settings.about.update.autoCheck")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.about.update.autoCheckDesc")}</p>
              </div>
              <Switch
                checked={autoCheckEnabled}
                onCheckedChange={setAutoCheckEnabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 更新日志 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("settings.about.changelog.title")}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBugDialogOpen(true)}
              className="hover:bg-primary/10 hover:border-primary hover:text-foreground"
            >
              <Bug className="mr-1.5 h-3.5 w-3.5" />
              {t("settings.about.bug.report")}
            </Button>
          </div>
          <CardDescription>{t("settings.about.changelog.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(changelogExpanded
            ? changelog?.releases
            : changelog?.releases.slice(0, CHANGELOG_COLLAPSED_COUNT)
          )?.map((release) => {
            // 版本号格式: "0.18.0" -> 外部显示 "v0.18"
            const versionParts = release.version.split('.')
            const displayVersion = versionParts.slice(0, 2).join('.')

            // 收集所有 entries 中的唯一作者，如果没有则使用 release 级别的 author
            let uniqueAuthors = release.entries
              ?.map(e => e.author)
              .filter((author, idx, arr) =>
                author && arr.findIndex(a => a?.username === author.username) === idx
              ) || []

            // Fallback: 如果 entries 没有 author，使用 release.author
            if (uniqueAuthors.length === 0 && release.author) {
              uniqueAuthors = [release.author]
            }

            return (
            <div
              key={release.version}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
              onClick={() => setSelectedRelease(release)}
            >
              {/* 版本信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    v{displayVersion}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{release.date}</span>
                  {release.entries && release.entries.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {release.entries.length} {t("settings.about.changelog.updates")}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {locale === "zh"
                    ? release.changes[0]?.text_zh
                    : release.changes[0]?.text_en}
                  {release.changes.length > 1 && ` (+${release.changes.length - 1})`}
                </p>
              </div>

              {/* 作者头像堆叠 + 箭头 */}
              <div className="flex items-center gap-1.5 shrink-0">
                {uniqueAuthors.length > 0 && (
                  <div className="flex -space-x-2">
                    {uniqueAuthors.slice(0, 3).map((author) => (
                      <Avatar key={author!.username} className="h-6 w-6 border-2 border-background" title={author!.name}>
                        <AvatarImage
                          src={author!.avatar_url ? `${RELEASE_SERVER_URL}${RELEASE_DIRECTORY}${author!.avatar_url}` : undefined}
                          alt={author!.name}
                        />
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {uniqueAuthors.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                        +{uniqueAuthors.length - 3}
                      </div>
                    )}
                  </div>
                )}
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            )
          })}

          {/* 展开/收起按钮 - 带渐变遮罩 */}
          {changelog && changelog.releases.length > CHANGELOG_COLLAPSED_COUNT && (
            <div className="relative">
              {/* 渐变遮罩 - 仅在折叠状态显示 */}
              {!changelogExpanded && (
                <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
              )}
              <button
                className={cn(
                  "w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                  "flex items-center justify-center gap-2",
                  "text-muted-foreground hover:text-primary",
                  "bg-muted/30 hover:bg-primary/10",
                  "border border-transparent hover:border-primary/20"
                )}
                onClick={() => setChangelogExpanded(!changelogExpanded)}
              >
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  changelogExpanded ? "-rotate-90" : "rotate-90"
                )} />
                {changelogExpanded
                  ? t("settings.about.changelog.showLess")
                  : t("settings.about.changelog.showMore").replace("{count}", String(changelog.releases.length - CHANGELOG_COLLAPSED_COUNT))
                }
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 版本详情弹窗 */}
      <Dialog open={!!selectedRelease} onOpenChange={(open) => !open && setSelectedRelease(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <span className="font-mono">
                v{selectedRelease?.version.split('.').slice(0, 2).join('.')}
              </span>
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {selectedRelease?.date}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedRelease?.entries?.length || selectedRelease?.changes?.length || 0} {t("settings.about.changelog.updates")}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {/* 显示详细 entries 或 changes */}
              {(selectedRelease?.entries || selectedRelease?.changes)?.map((entry, idx) => {
                const isEntry = 'title_zh' in entry
                // 标题和详情
                const title = isEntry
                  ? (locale === "zh" ? (entry as any).title_zh : (entry as any).title_en)
                  : (locale === "zh" ? entry.text_zh : entry.text_en)
                const detail = isEntry
                  ? (locale === "zh" ? (entry as any).detail_zh : (entry as any).detail_en)
                  : undefined
                // 优先使用 entry 的 author，fallback 到 release.author
                const entryAuthor = isEntry ? ((entry as any).author || selectedRelease?.author) : selectedRelease?.author
                // 版本号格式: "0.18.0" -> 内部显示 "0.18.1", "0.18.2"...
                const versionParts = selectedRelease?.version.split('.') || []
                const commitVersion = `${versionParts[0]}.${versionParts[1]}.${idx + 1}`

                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-lg bg-muted/50"
                  >
                    {/* 作者头像 - hover 显示详情 */}
                    {entryAuthor && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Avatar className="h-8 w-8 shrink-0 cursor-pointer">
                            <AvatarImage
                              src={entryAuthor.avatar_url ? `${RELEASE_SERVER_URL}${RELEASE_DIRECTORY}${entryAuthor.avatar_url}` : undefined}
                              alt={entryAuthor.name}
                            />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 bg-card border shadow-lg" side="right">
                          <div className="flex gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={entryAuthor.avatar_url ? `${RELEASE_SERVER_URL}${RELEASE_DIRECTORY}${entryAuthor.avatar_url}` : undefined}
                                alt={entryAuthor.name}
                              />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold">{entryAuthor.name}</h4>
                              <p className="text-xs text-muted-foreground">@{entryAuthor.username}</p>
                              {entryAuthor.github_url && (
                                <a
                                  href={entryAuthor.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  GitHub
                                </a>
                              )}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    )}

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      {/* 标题行：版本号 + 标题 */}
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          {commitVersion}
                        </Badge>
                        <span className="font-medium text-sm">{title}</span>
                      </div>
                      {/* 详情 (Markdown) */}
                      {detail && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                          <ReactMarkdown>{detail}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setSelectedRelease(null)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 帮助与反馈 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.about.helpFeedback")}</CardTitle>
          <CardDescription>{t("settings.about.helpFeedbackDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleDocs} className="hover:bg-primary/10 hover:border-primary hover:text-foreground">
            <FileText className="mr-2 h-4 w-4" />
            {t("settings.about.docs")}
          </Button>
          <Button variant="outline" onClick={handleFeedback} className="hover:bg-primary/10 hover:border-primary hover:text-foreground">
            <MessageSquare className="mr-2 h-4 w-4" />
            {t("settings.about.feedback")}
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </CardContent>
      </Card>

      {/* 服务条款 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.about.legal")}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="link" className="h-auto p-0 text-sm">
            {t("settings.about.terms")}
          </Button>
          <span className="text-muted-foreground">|</span>
          <Button variant="link" className="h-auto p-0 text-sm">
            {t("settings.about.privacyPolicy")}
          </Button>
        </CardContent>
      </Card>

      {/* Bug 报告弹窗 */}
      <Dialog open={bugDialogOpen} onOpenChange={(open) => {
        setBugDialogOpen(open)
        if (!open) resetBugForm()
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              {t("settings.about.bug.title")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.about.bug.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* 第一行：标题 */}
            <div className="space-y-2">
              <Label htmlFor="bug-title">{t("settings.about.bug.titleLabel")} *</Label>
              <Input
                id="bug-title"
                placeholder={t("settings.about.bug.titlePlaceholder")}
                value={bugTitle}
                onChange={(e) => setBugTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* 第二行：描述和复现步骤并排 */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bug-description">{t("settings.about.bug.descriptionLabel")} *</Label>
                <Textarea
                  id="bug-description"
                  placeholder={t("settings.about.bug.descriptionPlaceholder")}
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bug-steps">{t("settings.about.bug.stepsLabel")}</Label>
                <Textarea
                  id="bug-steps"
                  placeholder={t("settings.about.bug.stepsPlaceholder")}
                  value={bugSteps}
                  onChange={(e) => setBugSteps(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            {/* 第三行：截图和邮箱并排 */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* 截图上传 */}
              <div className="space-y-2">
                <Label>{t("settings.about.bug.screenshots")}</Label>
                <div className="flex flex-wrap gap-2">
                  {bugScreenshots.map((file, index) => (
                    <div
                      key={index}
                      className="relative group w-14 h-14 rounded-lg overflow-hidden border bg-muted"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleBugScreenshotRemove(index)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                  {bugScreenshots.length < 5 && (
                    <label className="w-14 h-14 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleBugScreenshotAdd}
                      />
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("settings.about.bug.screenshotsHint")}
                </p>
              </div>

              {/* 联系邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="bug-email">{t("settings.about.bug.emailLabel")}</Label>
                <Input
                  id="bug-email"
                  type="email"
                  placeholder={t("settings.about.bug.emailPlaceholder")}
                  value={bugEmail}
                  onChange={(e) => setBugEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("settings.about.bug.emailHint")}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBugDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmitBug}
              disabled={isSubmittingBug || bugTitle.trim().length < 5 || bugDescription.trim().length < 10}
            >
              {isSubmittingBug && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("settings.about.bug.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Beta 密钥弹窗 - 仅 Tauri 环境 */}
      {isTauriEnv && (
      <Dialog open={betaDialogOpen} onOpenChange={setBetaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              {t("settings.about.beta.title")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.about.beta.description")}
            </DialogDescription>
          </DialogHeader>

          {isBetaChannel ? (
            // 已在 Beta 通道
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t("settings.about.beta.activeTitle")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.about.beta.activeDesc")}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBetaDialogOpen(false)}>
                  {t("common.close")}
                </Button>
                <Button variant="destructive" onClick={handleExitBeta}>
                  <X className="mr-2 h-4 w-4" />
                  {t("settings.about.beta.exit")}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            // 输入 Beta 密钥
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={t("settings.about.beta.keyPlaceholder")}
                  value={betaKeyInput}
                  onChange={(e) => setBetaKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleValidateBetaKey()}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  {t("settings.about.beta.keyHint")}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBetaDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleValidateBetaKey}
                  disabled={!betaKeyInput.trim() || isValidating}
                >
                  {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("settings.about.beta.activate")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
}
