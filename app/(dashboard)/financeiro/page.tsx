import { getSessionAccessToken } from "@/lib/backend-api"
import { getSession } from "@/lib/auth-session"
import { FinanceiroFiltrado } from "@/components/financeiro/financeiro-filtrado"
import type { DashboardSummary } from "@/lib/types/dashboard"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

async function fetchDashboardSummaryServer(
  token: string | null | undefined,
  startDate: string,
  endDate: string
): Promise<DashboardSummary | null> {
  try {
    const params = new URLSearchParams({ startDate, endDate })
    const reqHeaders: Record<string, string> = {}
    if (token) reqHeaders["Authorization"] = `Bearer ${token}`

    const res = await fetch(`${BACKEND_URL}/api/dashboard?${params}`, {
      headers: reqHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      console.warn("[FinanceiroPage] Backend status:", res.status)
      return null
    }
    return (await res.json()) ?? null
  } catch (err) {
    console.warn("[FinanceiroPage] Falha ao buscar dashboard summary", err)
    return null
  }
}

export default async function FinanceiroPage() {
  const session = await getSession()
  const accessToken = getSessionAccessToken(session)

  const now = new Date()
  const initialMes = now.getMonth()
  const initialAno = now.getFullYear()
  const availableYears = Array.from(
    { length: initialAno - 2023 },
    (_, i) => 2024 + i
  )

  const antMes = initialMes === 0 ? 11 : initialMes - 1
  const antAno = initialMes === 0 ? initialAno - 1 : initialAno

  const startDate = new Date(Date.UTC(initialAno, initialMes, 1)).toISOString()
  const endDate = new Date(Date.UTC(initialAno, initialMes + 1, 1) - 1).toISOString()
  const antStart = new Date(Date.UTC(antAno, antMes, 1)).toISOString()
  const antEnd = new Date(Date.UTC(antAno, antMes + 1, 1) - 1).toISOString()

  const [summary, summaryAnterior] = await Promise.all([
    fetchDashboardSummaryServer(accessToken, startDate, endDate),
    fetchDashboardSummaryServer(accessToken, antStart, antEnd),
  ])

  return (
    <FinanceiroFiltrado
      initialSummary={summary}
      initialMes={initialMes}
      initialAno={initialAno}
      initialSummaryAnterior={summaryAnterior}
      availableYears={availableYears}
    />
  )
}
