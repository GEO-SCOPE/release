import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UpdateStatus =
  | 'idle'           // 空闲状态
  | 'checking'       // 检查更新中
  | 'available'      // 有可用更新
  | 'downloading'    // 下载中
  | 'ready'          // 准备安装
  | 'error'          // 错误

export type UpdateChannel = 'stable' | 'beta'

export interface UpdateInfo {
  version: string
  date: string
  notes: string
  isPrerelease?: boolean
}

interface UpdaterState {
  // 设置 (持久化)
  autoCheckEnabled: boolean
  lastCheckedAt: string | null

  // Beta 通道 (持久化)
  channel: UpdateChannel
  betaKey: string | null

  // 运行时状态
  status: UpdateStatus
  progress: number
  downloadedBytes: number
  totalBytes: number
  updateInfo: UpdateInfo | null
  errorMessage: string | null

  // Actions
  setAutoCheckEnabled: (enabled: boolean) => void
  setStatus: (status: UpdateStatus) => void
  setProgress: (progress: number, downloaded: number, total: number) => void
  setUpdateInfo: (info: UpdateInfo | null) => void
  setError: (message: string | null) => void
  setLastCheckedAt: (date: string | null) => void
  resetState: () => void

  // Beta channel actions
  setChannel: (channel: UpdateChannel) => void
  setBetaKey: (key: string | null) => void
  exitBetaChannel: () => void
}

export const useUpdaterStore = create<UpdaterState>()(
  persist(
    (set) => ({
      // 默认设置
      autoCheckEnabled: true,
      lastCheckedAt: null,

      // Beta 通道
      channel: 'stable',
      betaKey: null,

      // 初始状态
      status: 'idle',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      updateInfo: null,
      errorMessage: null,

      // Actions
      setAutoCheckEnabled: (enabled) => set({ autoCheckEnabled: enabled }),
      setStatus: (status) => set({ status, errorMessage: status === 'error' ? undefined : null }),
      setProgress: (progress, downloaded, total) => set({
        progress,
        downloadedBytes: downloaded,
        totalBytes: total,
      }),
      setUpdateInfo: (info) => set({ updateInfo: info }),
      setError: (message) => set({ errorMessage: message, status: 'error' }),
      setLastCheckedAt: (date) => set({ lastCheckedAt: date }),
      resetState: () => set({
        status: 'idle',
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        errorMessage: null,
      }),

      // Beta channel actions
      setChannel: (channel) => set({ channel }),
      setBetaKey: (key) => set({ betaKey: key, channel: key ? 'beta' : 'stable' }),
      exitBetaChannel: () => set({ channel: 'stable', betaKey: null }),
    }),
    {
      name: 'geo-scope-updater',
      partialize: (state) => ({
        autoCheckEnabled: state.autoCheckEnabled,
        lastCheckedAt: state.lastCheckedAt,
        channel: state.channel,
        betaKey: state.betaKey,
      }),
    }
  )
)
