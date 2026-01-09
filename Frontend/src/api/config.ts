/**
 * GEO-SCOPE API Configuration
 * Centralized API configuration with mode-based behavior
 */

import {
  appConfig,
  shouldUseMockData,
  shouldFallbackToMock,
  logApiCall,
  logApiResponse,
  logApiError,
  BACKEND_DIRECTORY as CONFIG_BACKEND_DIRECTORY,
} from '@/config'

// Re-export config values for convenience
export const API_BASE_URL = appConfig.api.baseUrl
export const BACKEND_DIRECTORY = CONFIG_BACKEND_DIRECTORY
export const API_TIMEOUT = appConfig.api.timeout
export const API_RETRY_ATTEMPTS = appConfig.api.retryAttempts
export const API_RETRY_DELAY = appConfig.api.retryDelay

// Re-export mode checks
export const isMockMode = appConfig.isMockMode
export const isDevelopMode = appConfig.isDevelopMode
export const isReleaseMode = appConfig.isReleaseMode

// API Error class
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public detail?: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

/**
 * Generic request function with mode-aware behavior
 * - mock: Returns error immediately (triggers fallback)
 * - develop: Makes request with fallback on failure
 * - release: Makes request without fallback
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // In mock mode, immediately throw to trigger fallback
  if (shouldUseMockData()) {
    logApiCall(options.method || 'GET', endpoint)
    throw new ApiError(0, "Mock mode - using mock data")
  }

  const url = `${API_BASE_URL}${endpoint}`
  logApiCall(options.method || 'GET', endpoint, options.body)

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  }

  // Add timeout for non-mock modes
  const controller = new AbortController()
  const timeoutId = API_TIMEOUT > 0
    ? setTimeout(() => controller.abort(), API_TIMEOUT)
    : null

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    })

    if (timeoutId) clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        response.status,
        errorData.detail || `HTTP ${response.status}`,
        errorData.error
      )
    }

    const data = await response.json()
    logApiResponse(endpoint, data)
    return data
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId)

    if (error instanceof ApiError) {
      logApiError(endpoint, error)
      throw error
    }

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      logApiError(endpoint, 'Request timeout')
      throw new ApiError(0, "Request timeout", String(error))
    }

    // Network error
    logApiError(endpoint, error)
    console.warn("API unavailable, using mock data")
    throw new ApiError(0, "Network error - using mock data", String(error))
  }
}

/**
 * Request with automatic fallback to mock data
 * Behavior based on mode:
 * - mock: Always returns fallback
 * - develop: Tries API, throws on failure (no fallback)
 * - release: Tries API, throws on failure (no fallback)
 */
export async function requestWithFallback<T>(
  endpoint: string,
  options: RequestInit = {},
  fallback: T
): Promise<T> {
  // Mock mode: always return fallback
  if (shouldUseMockData()) {
    logApiCall(options.method || 'GET', endpoint)
    logApiResponse(endpoint, fallback, true)
    return fallback
  }

  try {
    return await request<T>(endpoint, options)
  } catch (error) {
    // In develop mode, fall back to mock
    if (shouldFallbackToMock()) {
      console.warn(`API unavailable for ${endpoint}, using fallback data`)
      logApiResponse(endpoint, fallback, true)
      return fallback
    }

    // In release mode, propagate the error
    throw error
  }
}

/**
 * Request with retry logic (for develop and release modes)
 */
export async function requestWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  fallback?: T
): Promise<T> {
  // Mock mode: return fallback immediately
  if (shouldUseMockData()) {
    if (fallback === undefined) {
      throw new ApiError(0, "Mock mode - no fallback provided")
    }
    logApiCall(options.method || 'GET', endpoint)
    logApiResponse(endpoint, fallback, true)
    return fallback
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= API_RETRY_ATTEMPTS; attempt++) {
    try {
      return await request<T>(endpoint, options)
    } catch (error) {
      lastError = error as Error
      if (attempt < API_RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY))
      }
    }
  }

  // All retries failed
  if (shouldFallbackToMock() && fallback !== undefined) {
    console.warn(`API failed after ${API_RETRY_ATTEMPTS} retries, using fallback`)
    logApiResponse(endpoint, fallback, true)
    return fallback
  }

  throw lastError!
}
