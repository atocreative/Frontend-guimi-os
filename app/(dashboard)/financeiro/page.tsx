import { getFinanceiroSummaryServer } from "@/lib/backend-financeiro"
import { getSessionAccessToken, backendFetch } from "@/lib/backend-api"
import { getSession } from "@/lib/auth-session"
import { FinanceiroFiltrado } from "@/components/financeiro/financeiro-filtrado"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

async function fetchDespesasServer(token: string, startDate: string, endDate: string) {
  try {
    const params = new URLSearchParams({ startDate, endDate })
    const res = await fetch(
      `${BACKEND_URL}/payments-by-account-plan/pagar?${params}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8_000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data?.data ?? [])
  } catch {
    return []
  }
}

export default async function FinanceiroPage() {
  const session = await getSession()
  const accessToken = getSessionAccessToken(session)

  const now = new Date()
  const initialMes = now.getMonth()
  const initialAno = now.getFullYear()

  const antMes = initialMes === 0 ? 11 : initialMes - 1
  const antAno = initialMes === 0 ? initialAno - 1 : initialAno

  const startDate = new Date(Date.UTC(initialAno, initialMes, 1)).toISOString()
  const endDate   = new Date(Date.UTC(initialAno, initialMes + 1, 1) - 1).toISOString()

  const [summary, summaryAnterior, initialDespesas] = await Promise.all([
    getFinanceiroSummaryServer(accessToken).catch(() => null),
    getFinanceiroSummaryServer(accessToken, {
      startDate: new Date(Date.UTC(antAno, antMes, 1)).toISOString(),
      endDate:   new Date(Date.UTC(antAno, antMes + 1, 1) - 1).toISOString(),
    }).catch(() => null),
    accessToken ? fetchDespesasServer(accessToken, startDate, endDate) : Promise.resolve([]),
  ])

  return (
    <FinanceiroFiltrado
      initialSummary={summary}
      initialMes={initialMes}
      initialAno={initialAno}
      initialSummaryAnterior={summaryAnterior}
      initialDespesas={initialDespesas}
    />
  )
}
