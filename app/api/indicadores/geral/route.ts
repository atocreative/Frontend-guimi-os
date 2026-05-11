import { NextRequest, NextResponse } from "next/server"

/**
 * BFF — GET /api/indicadores/geral
 * DEPRECATED: Use /api/dashboard/summary instead
 * This endpoint now acts as a wrapper for backward compatibility.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const queryString = searchParams.toString()
  const url = `/api/dashboard/summary${queryString ? `?${queryString}` : ""}`

  const res = await fetch(url, {
    headers: req.headers,
    cache: "no-store",
  }).catch(() => null)

  if (!res) {
    return NextResponse.json({
      faturamento: 0, despesas: 0, compras: 0, lucro: 0,
      ticketMedio: 0, totalVendas: 0, estoqueTotal: 0, conversao: 0,
      _meta: { source: "fallback", ok: false },
    })
  }

  const data = await res.json().catch(() => null)
  if (!data) {
    return NextResponse.json({
      faturamento: 0, despesas: 0, compras: 0, lucro: 0,
      ticketMedio: 0, totalVendas: 0, estoqueTotal: 0, conversao: 0,
      _meta: { source: "fallback", ok: false },
    })
  }

  // Map dashboard response to indicadores KPI format
  const faturamento = Number(data.faturamentoMes ?? data.financeiro?.receita ?? 0)
  const despesas = Number(data.despesasMes ?? data.financeiro?.despesasVariaveis ?? 0)
  const compras = Number(data.comprasMes ?? 0)
  const lucro = Number(data.lucroLiquidoMes ?? data.financeiro?.netProfit ?? 0)
  const ticketMedio = Number(data.ticketMedio ?? 0)
  const totalVendas = Number(data.totalVendas ?? 0)

  return NextResponse.json({
    faturamento,
    despesas,
    compras,
    lucro,
    ticketMedio,
    totalVendas,
    estoqueTotal: 0,
    conversao: 0,
    _meta: { source: "dashboard", ok: true },
  })
}
