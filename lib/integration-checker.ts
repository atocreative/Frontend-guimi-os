/**
 * Integration Health Checker
 * Utility to verify if external APIs and integrations are reachable
 */

export interface IntegrationHealthStatus {
  status: number
  isHealthy: boolean
  error?: string
  responseTime?: number
}

/**
 * Check if an integration endpoint is healthy (returns 2xx status)
 */
export async function checkIntegrationHealth(
  baseUrl: string,
  timeout = 5000,
): Promise<IntegrationHealthStatus> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(baseUrl, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    }).catch(() => {
      return fetch(baseUrl, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      })
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    return {
      status: response.status,
      isHealthy: response.ok,
      responseTime,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      status: 0,
      isHealthy: false,
      error: errorMessage,
      responseTime,
    }
  }
}

/**
 * Check multiple integrations in parallel
 */
export async function checkMultipleIntegrations(
  integrations: { name: string; url: string }[],
): Promise<Map<string, IntegrationHealthStatus>> {
  const results = await Promise.all(
    integrations.map(async (integration) => [
      integration.name,
      await checkIntegrationHealth(integration.url),
    ]),
  )

  return new Map(results as [string, IntegrationHealthStatus][])
}

/**
 * Get integration status with better formatting
 */
export interface FormattedIntegrationStatus extends IntegrationHealthStatus {
  statusText: string
  connectionText: string
}

export function formatIntegrationStatus(
  status: IntegrationHealthStatus,
): FormattedIntegrationStatus {
  return {
    ...status,
    statusText:
      status.status === 0
        ? 'No Response'
        : `${status.status} ${getStatusMessage(status.status)}`,
    connectionText: status.isHealthy ? 'Conectado' : 'Desconectado',
  }
}

function getStatusMessage(status: number): string {
  if (status === 0) return 'No Connection'
  if (status < 200) return 'Informational'
  if (status < 300) return 'Success'
  if (status < 400) return 'Redirect'
  if (status < 500) return 'Client Error'
  return 'Server Error'
}
