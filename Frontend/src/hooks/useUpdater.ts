import { useCallback, useEffect, useRef } from 'react'
import { useUpdaterStore } from '@/store/updater-store'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import { RELEASE_SERVER_URL } from '@/config'

// 检测是否在 Tauri 环境中
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

export function useUpdater() {
  const { t } = useI18n()
  const hasCheckedOnStartup = useRef(false)
  const {
    autoCheckEnabled,
    lastCheckedAt,
    status,
    progress,
    downloadedBytes,
    totalBytes,
    updateInfo,
    errorMessage,
    channel,
    betaKey,
    setAutoCheckEnabled,
    setStatus,
    setProgress,
    setUpdateInfo,
    setError,
    setLastCheckedAt,
    resetState,
    setBetaKey,
    exitBetaChannel,
  } = useUpdaterStore()

  // 检查更新
  const checkForUpdates = useCallback(async (silent = false) => {
    if (!isTauri()) {
      if (!silent) {
        toast.info(t('settings.about.update.notInTauri'))
      }
      return null
    }

    try {
      setStatus('checking')

      // 动态导入 Tauri 插件
      const { check } = await import('@tauri-apps/plugin-updater')
      const update = await check()

      setLastCheckedAt(new Date().toISOString())

      if (update) {
        setUpdateInfo({
          version: update.version,
          date: update.date || new Date().toISOString(),
          notes: update.body || '',
        })
        setStatus('available')

        if (!silent) {
          toast.success(t('settings.about.update.available').replace('{version}', update.version))
        }

        return update
      } else {
        setStatus('idle')
        if (!silent) {
          toast.info(t('settings.about.update.upToDate'))
        }
        return null
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setError(message)
      if (!silent) {
        toast.error(t('settings.about.update.checkFailed'), {
          description: message,
          duration: 5000,
        })
      }
      console.error('Update check failed:', message)
      return null
    }
  }, [t, setStatus, setUpdateInfo, setError, setLastCheckedAt])

  // 下载并安装更新
  const downloadAndInstall = useCallback(async () => {
    if (!isTauri()) {
      toast.error(t('settings.about.update.notInTauri'))
      return
    }

    try {
      setStatus('downloading')

      const { check } = await import('@tauri-apps/plugin-updater')
      const update = await check()

      if (!update) {
        setError('No update available')
        return
      }

      let downloaded = 0
      let contentLength = 0

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0
            setProgress(0, 0, contentLength)
            break
          case 'Progress':
            downloaded += event.data.chunkLength
            const percent = contentLength > 0 ? Math.round((downloaded / contentLength) * 100) : 0
            setProgress(percent, downloaded, contentLength)
            break
          case 'Finished':
            setProgress(100, contentLength, contentLength)
            setStatus('ready')
            break
        }
      })

      // 提示用户重启
      toast.success(t('settings.about.update.downloadComplete'), {
        action: {
          label: t('settings.about.update.restartNow'),
          onClick: () => restartApp(),
        },
        duration: 10000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setError(message)
      toast.error(t('settings.about.update.downloadFailed'), {
        description: message,
        duration: 5000,
      })
      console.error('Update download failed:', message)
    }
  }, [t, setStatus, setProgress, setError])

  // 重启应用
  const restartApp = useCallback(async () => {
    if (!isTauri()) {
      return
    }

    try {
      const { relaunch } = await import('@tauri-apps/plugin-process')
      await relaunch()
    } catch (error) {
      console.error('Failed to restart app:', error)
    }
  }, [])

  // 验证 Beta 密钥
  const validateBetaKey = useCallback(async (key: string): Promise<boolean> => {
    if (!RELEASE_SERVER_URL) {
      toast.error(t('settings.about.beta.serverNotConfigured'))
      return false
    }

    try {
      const response = await fetch(`${RELEASE_SERVER_URL}/api/update/beta/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beta_key: key }),
      })

      const data = await response.json()

      if (data.valid) {
        setBetaKey(key)
        toast.success(t('settings.about.beta.activated'))
        // 立即检查 beta 更新
        checkForUpdates(true)
        return true
      } else {
        toast.error(t('settings.about.beta.invalidKey'))
        return false
      }
    } catch (error) {
      console.error('Failed to validate beta key:', error)
      toast.error(t('settings.about.beta.validationFailed'))
      return false
    }
  }, [t, setBetaKey, checkForUpdates])

  // 退出 Beta 通道
  const leaveBetaChannel = useCallback(() => {
    exitBetaChannel()
    resetState()
    toast.info(t('settings.about.beta.deactivated'))
  }, [exitBetaChannel, resetState, t])

  // 自动检查更新（启动时）
  useEffect(() => {
    if (autoCheckEnabled && !hasCheckedOnStartup.current && isTauri()) {
      hasCheckedOnStartup.current = true
      // 延迟 3 秒检查，避免启动时卡顿
      const timer = setTimeout(() => {
        checkForUpdates(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [autoCheckEnabled, checkForUpdates])

  return {
    // 状态
    status,
    progress,
    downloadedBytes,
    totalBytes,
    updateInfo,
    errorMessage,
    lastCheckedAt,
    autoCheckEnabled,
    isChecking: status === 'checking',
    isDownloading: status === 'downloading',
    hasUpdate: status === 'available',
    isReady: status === 'ready',
    isTauriEnv: isTauri(),

    // Beta 通道状态
    channel,
    betaKey,
    isBetaChannel: channel === 'beta',

    // Actions
    checkForUpdates,
    downloadAndInstall,
    restartApp,
    resetState,
    setAutoCheckEnabled,

    // Beta actions
    validateBetaKey,
    leaveBetaChannel,
  }
}
