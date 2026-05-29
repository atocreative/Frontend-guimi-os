import { getSessionAccessToken } from "@/lib/backend-api"
import { getSession } from "@/lib/auth-session"
import { protectPage } from "@/lib/route-protection"
import { FinanceiroFiltrado } from "@/components/financeiro/financeiro-filtrado"
import type { DashboardSummary } from "@/lib/types/dashboard"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

async function fetchDbSummaryServer(
  token: string | null | undefined,
  month: number,
  year: number
): Promise<DashboardSummary | null> {
  try {
    const params = new URLSearchParams({ month: String(month), year: String(year) })
    const reqHeaders: Record<string, string> = {}
    if (token) reqHeaders["Authorization"] = `Bearer ${token}`

    const [resumoRes, diarioRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/financeiro/db/summary?${params}`, {
        headers: reqHeaders,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }).catch(() => null),
      fetch(`${BACKEND_URL}/api/financeiro/diario?${params}`, {
        headers: reqHeaders,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }).catch(() => null),
    ])

    if (!resumoRes?.ok) {
      console.warn("[FinanceiroPage] db/summary status:", resumoRes?.status)
      return null
    }

    const resumo = await resumoRes.json().catch(() => null)
    if (!resumo) return null

    let grafico: DashboardSummary["grafico"] = []
    if (diarioRes?.ok) {
      const diario = await diarioRes.json().catch(() => null)
      if (Array.isArray(diario?.days)) {
        grafico = diario.days.map((d: { date: string; revenue: number }) => ({
          data: d.date,
          entradas: d.revenue,
          saidas: 0,
          saldo: d.revenue,
        }))
      }
    }

    const totalRevenue  = resumo.faturamentoMes ?? resumo.totalRevenue ?? 0
    const grossProfit   = resumo.grossProfit ?? 0
    const netProfit     = resumo.lucroLiquido ?? resumo.netProfit ?? 0
    const fixedExpenses = resumo.fixedExpenses ?? 0
    const cogs          = totalRevenue - grossProfit
    const totalExpenses = resumo.despesasMes ?? resumo.totalExpense ?? (cogs + fixedExpenses)

    return {
      faturamentoMes:       totalRevenue,
      despesasMes:          totalExpenses,
      lucroOperacionalMes:  grossProfit,
      lucroLiquidoMes:      netProfit,
      margemBruta:          resumo.margemBruta ?? (totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0),
      margemLiquida:        resumo.margem      ?? (totalRevenue > 0 ? (netProfit   / totalRevenue) * 100 : 0),
      totalVendas:          resumo.totalVendas ?? resumo.revenueCount ?? 0,
      ticketMedio:          resumo.ticketMedio ?? 0,
      grafico,
      updatedAt: resumo.updatedAt ?? null,
      _meta: { source: resumo._source ?? "postgresql" },
    }
  } catch (err) {
    console.warn("[FinanceiroPage] Falha ao buscar db/resumo", err)
    return null
  }
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function FinanceiroPage({ searchParams }: PageProps) {
  await protectPage({ featureId: "FINANCEIRO", requiredRole: "ADMIN" })

  const session = await getSession()
  const accessToken = getSessionAccessToken(session)
  const params = await searchParams

  const now = new Date()
  const currentMes = now.getMonth()
  const currentAno = now.getFullYear()

  // URL convention: m = 1-indexed month (Jan=1 … Dec=12). State stays 0-indexed internamente.
  const mParam = Number(params.m)
  const yParam = Number(params.y)
  const initialMes = mParam >= 1 && mParam <= 12 ? mParam - 1 : currentMes
  const initialAno = yParam >= 2024 && yParam <= currentAno ? yParam : currentAno

  const availableYears = Array.from(
    { length: currentAno - 2023 },
    (_, i) => 2024 + i
  )

  const antMes = initialMes === 0 ? 11 : initialMes - 1
  const antAno = initialMes === 0 ? initialAno - 1 : initialAno

  const [summary, summaryAnterior] = await Promise.all([
    fetchDbSummaryServer(accessToken, initialMes + 1, initialAno),
    fetchDbSummaryServer(accessToken, antMes + 1, antAno),
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
