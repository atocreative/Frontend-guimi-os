import { getSessionAccessToken } from "@/lib/backend-api"
import { getSession } from "@/lib/auth-session"
import { protectPage } from "@/lib/route-protection"
import { ProcessosDashboard } from "@/components/processos/processos-dashboard"
import type { DashboardSummary } from "@/lib/types/dashboard"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

async function fetchSummaryServer(
  token: string | null | undefined,
  month: number,
  year: number,
): Promise<DashboardSummary | null> {
  try {
    const params = new URLSearchParams({ month: String(month), year: String(year) })
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`

    const res = await fetch(`${BACKEND_URL}/api/financeiro/db/summary?${params}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)

    if (!res?.ok) return null
    const data = await res.json().catch(() => null)
    if (!data) return null

    const totalRevenue  = data.faturamentoMes ?? data.totalRevenue ?? 0
    const grossProfit   = data.grossProfit ?? 0
    const netProfit     = data.lucroLiquido ?? data.netProfit ?? 0
    const fixedExpenses = data.fixedExpenses ?? 0
    const cogs          = totalRevenue - grossProfit
    const totalExpenses = data.despesasMes ?? data.totalExpense ?? (cogs + fixedExpenses)

    return {
      faturamentoMes:      totalRevenue,
      despesasMes:         totalExpenses,
      lucroOperacionalMes: grossProfit,
      lucroLiquidoMes:     netProfit,
      margemBruta:         data.margemBruta ?? (totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0),
      margemLiquida:       data.margem      ?? (totalRevenue > 0 ? (netProfit   / totalRevenue) * 100 : 0),
      totalVendas:         data.totalVendas ?? data.revenueCount ?? 0,
      ticketMedio:         data.ticketMedio ?? 0,
      updatedAt:           data.updatedAt   ?? null,
      _meta:               { source: data._source ?? "postgresql" },
    }
  } catch {
    return null
  }
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ProcessosPage({ searchParams }: PageProps) {
  await protectPage({ featureId: "FINANCEIRO", requiredRole: "ADMIN" })

  const session      = await getSession()
  const accessToken  = getSessionAccessToken(session)
  const params       = await searchParams

  const now         = new Date()
  const currentMes  = now.getMonth()
  const currentAno  = now.getFullYear()

  const mParam      = Number(params.m)
  const yParam      = Number(params.y)
  const initialMes  = mParam >= 0 && mParam <= 11 ? mParam : currentMes
  const initialAno  = yParam >= 2024 && yParam <= currentAno ? yParam : currentAno

  const availableYears = Array.from({ length: currentAno - 2023 }, (_, i) => 2024 + i)

  const summary = await fetchSummaryServer(accessToken, initialMes + 1, initialAno)

  return (
    <ProcessosDashboard
      initialSummary={summary}
      initialMes={initialMes}
      initialAno={initialAno}
      availableYears={availableYears}
    />
  )
}
