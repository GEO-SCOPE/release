/**
 * Health Check API
 */

import { requestWithFallback } from '@/api/config'

export const healthCheck = async (): Promise<{ status: string; version: string }> => {
  return requestWithFallback(
    "/health",
    {},
    { status: "ok (mock)", version: "1.0.0" }
  )
}
