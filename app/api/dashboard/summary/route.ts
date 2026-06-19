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

  let month1: number
  let year: number

  const startDate = searchParams.get("startDate")
  if (startDate) {
    const d = new Date(startDate)
    month1 = isNaN(d.getTime()) ? now.getMonth() + 1 : d.getMonth() + 1
    year   = isNaN(d.getTime()) ? now.getFullYear()  : d.getFullYear()
  } else {
    const yearParam  = searchParams.get("year")
    const monthParam = searchParams.get("month")
    year   = yearParam  ? parseInt(yearParam,  10) : now.getFullYear()
    month1 = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1
  }

  const dayParam = searchParams.get("day")
  const day = dayParam ? parseInt(dayParam, 10) : null

  const params = new URLSearchParams({ month: String(month1), year: String(year) })
  if (day) params.set("day", String(day))

  const reqHeaders: Record<string, string> = {}
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)
    if (token) reqHeaders["Authorization"] = `Bearer ${token}`
  } catch {
    // proceed without auth
  }

  // Prev month — for server-side comparison computation when backend doesn't send comparisons
  const prevMonth1 = month1 === 1 ? 12 : month1 - 1
  const prevYear_  = month1 === 1 ? year - 1 : year
  const prevParams = new URLSearchParams({ month: String(prevMonth1), year: String(prevYear_) })

  // PRIMARY: backend's own /api/dashboard/summary has canonical FN-sourced KPIs
  // SECONDARY: /api/financeiro/diario provides daily breakdown for the chart
  // TERTIARY: prev month summary for MTD-correct comparison computation
  const [bdRes, diarioRes, prevBdRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/dashboard/summary?${params}`, {
      headers: reqHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    }).catch(() => null),
    fetch(`${BACKEND_URL}/api/financeiro/diario?${params}`, {
      headers: reqHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null),
    fetch(`${BACKEND_URL}/api/dashboard/summary?${prevParams}`, {
      headers: reqHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    }).catch(() => null),
  ])

  if (!bdRes || !bdRes.ok) {
    console.error(`[SUMMARY] backend /api/dashboard/summary returned ${bdRes?.status ?? "no response"}`)
    return NextResponse.json(
      { error: "DASHBOARD_SUMMARY_FAILED", message: `Backend returned ${bdRes?.status ?? "no response"}` },
      { status: 502 }
    )
  }

  const bd = await bdRes.json().catch(() => null)
  if (!bd) {
    return NextResponse.json({ error: "DASHBOARD_SUMMARY_FAILED", message: "Failed to parse response" }, { status: 502 })
  }

  // ── canonical KPIs (source: FN live or snapshot via backend) ──────────────
  const faturamentoMes  = Number(bd.faturamentoMes  ?? 0)
  const lucroBrutoMes   = Number(bd.lucroBrutoMes   ?? bd.lucro ?? 0)
  const lucroLiquidoReal = Number(bd.lucroLiquidoReal ?? 0)
  const totalGastos      = Number(bd.comprasMes ?? 0)

  // ── margin ratios for chart saldo line ────────────────────────────────────
  const brutoRatio = faturamentoMes > 0 ? lucroBrutoMes / faturamentoMes : 0

  // ── build grafico from daily breakdown ────────────────────────────────────
  let grafico: Array<{ data: string; entradas: number; saidas: number; saldo: number }> = []
  if (diarioRes?.ok) {
    const diario = await diarioRes.json().catch(() => null)
    if (Array.isArray(diario?.days)) {
      grafico = diario.days.map((d: { date: string; revenue: number }) => ({
        data:     d.date,
        entradas: Number(d.revenue ?? 0),
        saidas:   0,
        saldo:    Math.round(Number(d.revenue ?? 0) * brutoRatio),
      }))
    }
  }

  // Products: resilient pass-through (guard against different field names from backend)
  const produtosVendidosMes        = bd.produtosVendidosMes        ?? bd.produtosVendidos         ?? null
  const produtosVendidosMeta       = bd.produtosVendidosMeta       ?? null
  const produtosVendidosPercentual = bd.produtosVendidosPercentual ?? null
  const produtosVendidosBreakdown  = bd.produtosVendidosBreakdown  ?? null
  const produtosVendidosDia        = bd.produtosVendidosDia        ?? null
  const produtosVendidosDiaBreakdown = bd.produtosVendidosDiaBreakdown ?? null
  const backendInsights            = Array.isArray(bd.insights) ? bd.insights : (bd.smartInsights ?? null)

  console.log(`[SUMMARY] canonical — faturamentoMes:${faturamentoMes} lucroBrutoMes:${lucroBrutoMes} lucroLiquidoDia:${bd.lucroLiquidoDia} produtosVendidosMes:${bd.produtosVendidosMes}`)
  console.log(`[BFF_SUMMARY_FIELDS] products=${produtosVendidosMes != null} insightsCount=${Array.isArray(backendInsights) ? backendInsights.length : 0} stale=${bd.stale}`)

  // Compute comparisons server-side — wrapped in try/catch to prevent route crash
  let comparisons: Record<string, unknown> | null = null
  try {
    if (bd.comparisons) {
      comparisons = bd.comparisons
    } else if (prevBdRes?.ok) {
      const prevBd = await prevBdRes.json().catch(() => null)
      if (prevBd) {
        const MESES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
        const isMTD = month1 === now.getMonth() + 1 && year === now.getFullYear()
        const daysInPrevMonth = new Date(prevYear_, prevMonth1, 0).getDate()
        const scale = isMTD && daysInPrevMonth > 0 ? now.getDate() / daysInPrevMonth : 1
        const prevMonthName = MESES_PT[prevMonth1 - 1] ?? ""
        const periodLabel = isMTD ? `vs mesmo período de ${prevMonthName}` : `vs ${prevMonthName}`

        const mkComp = (curr: number, prev: number) => {
          if (!prev || !curr) return null
          const delta = ((curr - prev) / prev) * 100
          return { delta: Math.round(delta * 10) / 10, direction: (delta >= 0 ? "up" : "down") as "up" | "down", label: periodLabel }
        }

        comparisons = {
          faturamentoMes:      mkComp(faturamentoMes,  Number(prevBd.faturamentoMes  ?? 0) * scale),
          totalGastos:         mkComp(totalGastos,      Number(prevBd.comprasMes      ?? 0) * scale),
          lucroBrutoMes:       mkComp(lucroBrutoMes,    Number(prevBd.lucroBrutoMes   ?? prevBd.lucro ?? 0) * scale),
          lucroLiquidoReal:    mkComp(lucroLiquidoReal, Number(prevBd.lucroLiquidoReal ?? 0) * scale),
          produtosVendidosMes: mkComp(Number(produtosVendidosMes ?? 0), Number(prevBd.produtosVendidosMes ?? prevBd.produtosVendidos ?? 0) * scale),
        }
      }
    }
  } catch (err) {
    console.error("[BFF_COMPARISONS_ERROR]", err)
    comparisons = null
  }

  const result = {
    // ── Canonical fields (pass-through from backend) ──
    produtosVendidosMes,
    produtosVendidosBreakdown,
    produtosVendidosMeta,
    produtosVendidosPercentual,
    produtosVendidosDia,
    produtosVendidosDiaBreakdown,
    faturamentoMes,
    faturamentoDia:             bd.faturamentoDia   ?? null,
    lucroBrutoMes,
    lucroBrutoDia:              bd.lucroBrutoDia    ?? null,
    lucroLiquidoDia:            bd.lucroLiquidoDia  ?? null,
    lucroLiquidoReal,
    totalGastos,

    // ── Backward-compat aliases (consumed by existing hook consumers) ──
    lucroOperacionalMes: lucroBrutoMes,
    lucroLiquidoMes:     Number(bd.lucroLiquido ?? 0),
    despesasMes:         totalGastos,
    margemBruta:         faturamentoMes > 0 ? (lucroBrutoMes   / faturamentoMes) * 100 : 0,
    margemLiquida:       faturamentoMes > 0 ? (lucroLiquidoReal / faturamentoMes) * 100 : 0,
    totalVendas:         bd.totalVendasMes  ?? 0,
    ticketMedio:         bd.ticketMedio     ?? 0,

    // ── Chart ──
    grafico,

    // ── Comparisons & Insights ──
    comparisons,
    insights:    backendInsights,
    stale:       bd.stale       ?? false,
    staleReason: bd.staleReason ?? null,
    syncedAt:    bd.syncedAt    ?? null,

    // ── Meta ──
    updatedAt:  bd.updatedAt  ?? null,
    sourceType: bd._source    ?? null,
    sources:    bd.sources    ?? null,
    _meta: {
      source:     bd._source ?? "backend/dashboard/summary",
      isStable:   true,
    },
  }

  return NextResponse.json(result)
}
