/**
 * GEO-SCOPE Application Configuration
 *
 * Development Modes:
 * - mock: All API calls return mock data (default for development)
 * - develop: API calls to development backend, no fallback (throws on failure)
 * - test: API calls to test server (test.geo-scope.ai)
 * - release: API calls to production backend, no fallback (throws on failure)
 */

// =============================================================================
// Environment & Mode Configuration
// =============================================================================

export type AppMode = 'mock' | 'develop' | 'test' | 'release'

// Get mode from environment variable, default to 'mock'
export const APP_MODE: AppMode = (import.meta.env.VITE_APP_MODE as AppMode) || 'mock'

// API Base URLs for different environments
const API_URLS: Record<AppMode, string> = {
  mock: '',  // Mock mode doesn't need a real URL
  develop: import.meta.env.VITE_API_URL_DEV || 'http://localhost:8000',
  test: import.meta.env.VITE_API_URL_TEST || 'https://dev.geo-scope.ai',
  release: import.meta.env.VITE_API_URL_PROD || 'https://geo-scope.ai',
}

// Release Server URLs (for update and changelog)
const RELEASE_URLS: Record<AppMode, string> = {
  mock: '',
  develop: import.meta.env.VITE_RELEASE_URL_DEV || 'http://localhost:8001',
  test: import.meta.env.VITE_RELEASE_URL_TEST || 'https://releases.geo-scope.ai',
  release: import.meta.env.VITE_RELEASE_URL_PROD || 'https://releases.geo-scope.ai',
}

// Get the current API base URL based on mode
export const API_BASE_URL = API_URLS[APP_MODE]
export const RELEASE_SERVER_URL = RELEASE_URLS[APP_MODE]

// Backend directory path (for static resources like images)
// test/release 模式需要 /api 前缀（因为 Nginx 代理配置）
const BACKEND_DIRS: Record<AppMode, string> = {
  mock: '',
  develop: '',  // 本地开发直接访问后端，不需要前缀
  test: import.meta.env.BACKEND_DIRECTORY || '/api',
  release: import.meta.env.BACKEND_DIRECTORY || '/api',
}
export const BACKEND_DIRECTORY = BACKEND_DIRS[APP_MODE]

// Release server directory path (for static resources like avatars)
// 同理，test/release 模式需要 /api 前缀
const RELEASE_DIRS: Record<AppMode, string> = {
  mock: '',
  develop: '',  // 本地开发直接访问 Release 服务器，不需要前缀
  test: import.meta.env.RELEASE_DIRECTORY || '/api',
  release: import.meta.env.RELEASE_DIRECTORY || '/api',
}
export const RELEASE_DIRECTORY = RELEASE_DIRS[APP_MODE]

// =============================================================================
// Feature Flags
// =============================================================================

export interface FeatureFlags {
  // API behavior
  useMockData: boolean           // Force mock data regardless of API availability
  enableApiFallback: boolean     // Fall back to mock when API fails
  logApiCalls: boolean           // Log API requests to console

  // Features
  enableAIGeneration: boolean    // Enable AI-powered persona/benchmark generation
  enableRealSimulation: boolean  // Enable real AI engine simulations
  enableAnalytics: boolean       // Enable analytics tracking

  // UI/UX
  showDevTools: boolean          // Show developer tools/debug info
  enableMockBanner: boolean      // Show "Mock Mode" banner
}

const modeFeatures: Record<AppMode, FeatureFlags> = {
  mock: {
    useMockData: true,
    enableApiFallback: false,  // Not needed in mock mode
    logApiCalls: true,
    enableAIGeneration: false,
    enableRealSimulation: false,
    enableAnalytics: false,
    showDevTools: true,
    enableMockBanner: true,
  },
  develop: {
    useMockData: false,
    enableApiFallback: false,  // 非mock模式不使用fallback，API失败直接抛错
    logApiCalls: true,
    enableAIGeneration: true,
    enableRealSimulation: true,
    enableAnalytics: false,
    showDevTools: true,
    enableMockBanner: false,
  },
  test: {
    useMockData: false,
    enableApiFallback: false,
    logApiCalls: true,  // 测试环境保留日志
    enableAIGeneration: true,
    enableRealSimulation: true,
    enableAnalytics: false,  // 测试环境不上报分析
    showDevTools: true,  // 测试环境显示开发工具
    enableMockBanner: false,
  },
  release: {
    useMockData: false,
    enableApiFallback: false,  // No fallback in production
    logApiCalls: false,
    enableAIGeneration: true,
    enableRealSimulation: true,
    enableAnalytics: true,
    showDevTools: false,
    enableMockBanner: false,
  },
}

export const features: FeatureFlags = modeFeatures[APP_MODE]

// =============================================================================
// API Configuration
// =============================================================================

export interface ApiConfig {
  baseUrl: string
  timeout: number
  retryAttempts: number
  retryDelay: number
}

const modeApiConfig: Record<AppMode, ApiConfig> = {
  mock: {
    baseUrl: '',
    timeout: 0,  // No timeout for mock
    retryAttempts: 0,
    retryDelay: 0,
  },
  develop: {
    baseUrl: API_URLS.develop,
    timeout: 30000,  // 30s timeout
    retryAttempts: 2,
    retryDelay: 1000,
  },
  test: {
    baseUrl: API_URLS.test,
    timeout: 30000,  // 30s timeout
    retryAttempts: 2,
    retryDelay: 1000,
  },
  release: {
    baseUrl: API_URLS.release,
    timeout: 15000,  // 15s timeout
    retryAttempts: 3,
    retryDelay: 500,
  },
}

export const apiConfig: ApiConfig = modeApiConfig[APP_MODE]

// =============================================================================
// Storage Configuration
// =============================================================================

export interface StorageConfig {
  prefix: string
  projectStoreKey: string
  brandStoreKey: string
  themeKey: string
  accentColorKey: string
}

export const storageConfig: StorageConfig = {
  prefix: 'geo-scope',
  projectStoreKey: 'geo-scope-project-store',
  brandStoreKey: 'GEO-SCOPE-brand-storage',
  themeKey: 'geo-scope-theme',
  accentColorKey: 'geo-scope-accent-color',
}

// =============================================================================
// Application Configuration
// =============================================================================

export interface AppConfig {
  mode: AppMode
  features: FeatureFlags
  api: ApiConfig
  storage: StorageConfig

  // App-level settings
  appName: string
  version: string
  defaultLanguage: 'zh' | 'en'

  // Debug helpers
  isMockMode: boolean
  isDevelopMode: boolean
  isTestMode: boolean
  isReleaseMode: boolean
}

export const appConfig: AppConfig = {
  mode: APP_MODE,
  features,
  api: apiConfig,
  storage: storageConfig,

  appName: 'GEO-SCOPE',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  defaultLanguage: 'zh',

  isMockMode: APP_MODE === 'mock',
  isDevelopMode: APP_MODE === 'develop',
  isTestMode: APP_MODE === 'test',
  isReleaseMode: APP_MODE === 'release',
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if we should use mock data for API calls
 */
export function shouldUseMockData(): boolean {
  return features.useMockData
}

/**
 * Check if we should fall back to mock data on API failure
 */
export function shouldFallbackToMock(): boolean {
  return features.enableApiFallback
}

/**
 * Log API call if logging is enabled
 */
export function logApiCall(method: string, endpoint: string, data?: unknown): void {
  if (features.logApiCalls) {
    console.log(`[API ${APP_MODE}] ${method} ${endpoint}`, data || '')
  }
}

/**
 * Log API response if logging is enabled
 */
export function logApiResponse(endpoint: string, response: unknown, isMock: boolean = false): void {
  if (features.logApiCalls) {
    const tag = isMock ? '[MOCK]' : '[API]'
    console.log(`${tag} Response from ${endpoint}:`, response)
  }
}

/**
 * Log API error if logging is enabled
 */
export function logApiError(endpoint: string, error: unknown): void {
  if (features.logApiCalls) {
    console.error(`[API Error] ${endpoint}:`, error)
  }
}

// Default export
export default appConfig
