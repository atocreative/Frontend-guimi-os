import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"
import {
  getMonthRange,
  buildSalesFilters,
  calculateRevenue,
  filtersToSearchParams,
  type SaleItem,
} from "@/lib/financeiro-utils"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

/**
 * BFF — GET /api/financeiro/summary
 *
 * Chama o backend com filtro de período correto (mês atual).
 * NÃO usa snapshot. NÃO usa dados históricos.
 * Erro real se backend falhar — sem fallback silencioso.
 */
export async function GET() {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { startDate, endDate } = getMonthRange()
  const filters = buildSalesFilters({ startDate, endDate })
  const params = filtersToSearchParams(filters)

  // Chama o endpoint de vendas do backend (que por sua vez chama FoneNinja)
  const salesRes = await fetch(
    `${BACKEND_URL}/api/financeiro/sales?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }
  ).catch((err) => {
    throw new Error(`SALES_FETCH_NETWORK_ERROR: ${err.message}`)
  })

  if (!salesRes.ok) {
    return NextResponse.json(
      { error: "SALES_FETCH_FAILED", status: salesRes.status, period: { startDate, endDate } },
      { status: 502 }
    )
  }

  const salesData = await salesRes.json()
  const sales: SaleItem[] = Array.isArray(salesData)
    ? salesData
    : (salesData?.data ?? salesData?.sales ?? salesData?.items ?? [])

  if (!sales || sales.length === 0) {
    return NextResponse.json(
      { error: "NO_SALES_DATA_FOR_PERIOD", period: { startDate, endDate } },
      { status: 404 }
    )
  }

  const receitaMes = calculateRevenue(sales)
  const quantidadeVendas = sales.length

  // Busca meta e despesas do snapshot (campos complementares, não a receita)
  const snapshotRes = await fetch(
    `${BACKEND_URL}/api/financeiro/snapshot?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    }
  ).catch(() => null)

  let snapshotPayload: Record<string, unknown> = {}
  if (snapshotRes?.ok) {
    const snapshotData = await snapshotRes.json().catch(() => null)
    snapshotPayload = snapshotData?.data ?? snapshotData ?? {}
  }

  const metaMes = Number(snapshotPayload.metaMes ?? snapshotPayload.meta ?? 0)
  const percentualMeta = metaMes > 0 ? Math.round((receitaMes / metaMes) * 100 * 10) / 10 : 0
  const despesasMes = Number(snapshotPayload.despesasMes ?? snapshotPayload.totalDespesas ?? 0)
  const lucroLiquidoMes = Number(
    snapshotPayload.lucroLiquidoMes ?? snapshotPayload.netProfit ?? snapshotPayload.lucroLiquido ?? 0
  )

  return NextResponse.json({
    // Receita — vem EXCLUSIVAMENTE das vendas filtradas pelo mês
    receitaMes,
    quantidadeVendas,
    periodo: { startDate, endDate },

    // Complementares — vêm do snapshot
    despesasMes,
    lucroLiquidoMes,
    metaMes,
    percentualMeta,

    // Resumo de hoje — snapshot
    receitaHoje: Number(snapshotPayload.receitaHoje ?? snapshotPayload.todayRevenue ?? 0),
    lucroBrutoHoje: Number(snapshotPayload.lucroBrutoHoje ?? snapshotPayload.todayProfit ?? 0),
    margemBrutoHoje: Number(snapshotPayload.margemBrutoHoje ?? snapshotPayload.todayMargin ?? 0),
  })
}
