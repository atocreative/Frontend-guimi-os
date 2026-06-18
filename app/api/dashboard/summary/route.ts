import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const now = new Date()

  let month1: number // 1-indexed for backend
  let year: number

  const startDate = searchParams.get("startDate")
  if (startDate) {
    const d = new Date(startDate)
    month1 = isNaN(d.getTime()) ? now.getMonth() + 1 : d.getMonth() + 1
    year   = isNaN(d.getTime()) ? now.getFullYear()  : d.getFullYear()
  } else {
    // Called with year=YYYY&month=M where month is 1-indexed (Jan=1 … Dec=12)
    const yearParam  = searchParams.get("year")
    const monthParam = searchParams.get("month")
    year   = yearParam  ? parseInt(yearParam,  10) : now.getFullYear()
    month1 = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1
  }

  const dayParam = searchParams.get("day")
  const day = dayParam ? parseInt(dayParam, 10) : null

  const params = new URLSearchParams({ month: String(month1), year: String(year) })

  const reqHeaders: Record<string, string> = {}
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)
    if (token) reqHeaders["Authorization"] = `Bearer ${token}`
  } catch {
    // proceed without auth
  }

  // Fetch DB summary + daily breakdown in parallel (PostgreSQL source of truth)
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

  if (!resumoRes || !resumoRes.ok) {
    return NextResponse.json(
      { error: "DASHBOARD_SUMMARY_FAILED", message: `Backend returned ${resumoRes?.status ?? "no response"}` },
      { status: 502 }
    )
  }

  const resumo = await resumoRes.json().catch(() => null)
  if (!resumo) {
    return NextResponse.json({ error: "DASHBOARD_SUMMARY_FAILED", message: "Failed to parse response" }, { status: 502 })
  }

  // Map backend fields to DashboardSummary shape (needed before grafico to compute margin)
  const totalRevenue  = resumo.faturamentoMes ?? resumo.totalRevenue  ?? 0
  const grossProfit   = resumo.grossProfit    ?? 0
  const netProfit     = resumo.lucroLiquido   ?? resumo.netProfit     ?? 0

  // Net margin ratio used to estimate daily profit from daily revenue
  const netMarginRatio = totalRevenue > 0 ? netProfit / totalRevenue : 0

  // Build grafico from daily breakdown; also extract specific day revenue
  let grafico: Array<{ data: string; entradas: number; saidas: number; saldo: number }> = []
  let faturamentoDia: number | null = null
  let lucroLiquidoDia: number | null = null
  if (diarioRes?.ok) {
    const diario = await diarioRes.json().catch(() => null)
    if (Array.isArray(diario?.days)) {
      grafico = diario.days.map((d: { date: string; revenue: number }) => ({
        data: d.date,
        entradas: d.revenue,
        saidas: 0,
        // Estimated daily profit = daily revenue × monthly net margin ratio
        saldo: Math.round(d.revenue * netMarginRatio),
      }))
      if (day !== null) {
        // Match by day-of-month in the date string (YYYY-MM-DD)
        const match = diario.days.find((d: { date: string; revenue: number }) => {
          const parsed = new Date(d.date)
          return parsed.getUTCDate() === day
        })
        faturamentoDia = match ? Number(match.revenue) : 0
        lucroLiquidoDia = faturamentoDia !== null ? Math.round(faturamentoDia * netMarginRatio) : null
      } else {
        // Monthly fetch (no day param): auto-derive today's revenue from the daily breakdown
        // Only applies to the current month — past months have no "today"
        const todayUTC = now.getUTCDate()
        const thisMonthUTC = now.getUTCMonth() + 1
        const thisYearUTC = now.getUTCFullYear()
        if (month1 === thisMonthUTC && year === thisYearUTC) {
          const todayEntry = diario.days.find((d: { date: string; revenue: number }) => {
            const p = new Date(d.date)
            return p.getUTCDate() === todayUTC
          })
          if (todayEntry) {
            faturamentoDia = Number(todayEntry.revenue)
            lucroLiquidoDia = Math.round(faturamentoDia * netMarginRatio)
          }
        }
      }
    }
  }
  const fixedExpenses = resumo.fixedExpenses ?? 0
  const cogs          = totalRevenue - grossProfit
  const totalExpenses = resumo.despesasMes ?? resumo.totalExpense ?? (cogs + fixedExpenses)

  const result = {
    faturamentoMes:      totalRevenue,
    despesasMes:         totalExpenses,
    lucroOperacionalMes: grossProfit,
    lucroLiquidoMes:     netProfit,
    margemBruta:         resumo.margemBruta ?? (totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0),
    margemLiquida:       resumo.margem      ?? (totalRevenue > 0 ? (netProfit   / totalRevenue) * 100 : 0),
    totalVendas:         resumo.totalVendas ?? resumo.revenueCount ?? 0,
    ticketMedio:         resumo.ticketMedio ?? 0,
    faturamentoDia,
    lucroLiquidoDia,
    grafico,
    updatedAt:  resumo.updatedAt ?? null,
    sourceType: resumo.sourceType ?? null,
    _meta: {
      source: resumo._source ?? "postgresql",
      sourceType: resumo.sourceType ?? null,
      isStable: resumo.sourceType === "live" || resumo.sourceType === "snapshot" || resumo.sourceType == null,
    },
  }


  return NextResponse.json(result)
}
