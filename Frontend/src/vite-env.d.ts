/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_MODE: 'mock' | 'develop' | 'release'
  readonly VITE_APP_VERSION: string
  readonly VITE_API_URL_DEV: string
  readonly VITE_API_URL_PROD: string
  readonly BACKEND_DIRECTORY: string
  readonly VITE_RELEASE_URL_DEV: string
  readonly VITE_RELEASE_URL_PROD: string
  readonly RELEASE_DIRECTORY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 构建时注入的常量
declare const __BUILD_DATE__: string
declare const __APP_VERSION__: string
