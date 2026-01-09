import { useState, useEffect } from 'react'

interface AppInfo {
  version: string
  name: string
  buildDate: string
  tauriVersion?: string  // 仅 Tauri 环境有
}

// 检测是否在 Tauri 环境中
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * 获取应用本地信息
 * - Tauri 环境: 从 Tauri API 获取真实的安装版本
 * - Web 环境: 从构建时注入的常量获取
 */
export function useTauriInfo() {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isTauriEnv = isTauri()

  useEffect(() => {
    const fetchInfo = async () => {
      if (isTauriEnv) {
        // Tauri 环境：从本地 API 获取
        try {
          const { getVersion, getName, getTauriVersion } = await import('@tauri-apps/api/app')

          const [version, name, tauriVersion] = await Promise.all([
            getVersion(),
            getName(),
            getTauriVersion(),
          ])

          setInfo({
            version,
            name,
            tauriVersion,
            buildDate: __BUILD_DATE__,
          })
        } catch (error) {
          console.error('Failed to get Tauri app info:', error)
          // 回退到构建时注入的值
          setInfo({
            version: __APP_VERSION__,
            name: 'GEO-SCOPE',
            buildDate: __BUILD_DATE__,
          })
        }
      } else {
        // Web 环境：使用构建时注入的值
        setInfo({
          version: __APP_VERSION__,
          name: 'GEO-SCOPE',
          buildDate: __BUILD_DATE__,
        })
      }

      setIsLoading(false)
    }

    fetchInfo()
  }, [isTauriEnv])

  return {
    info,
    isLoading,
    isTauriEnv,
  }
}
