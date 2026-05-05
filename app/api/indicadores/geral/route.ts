import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

/**
 * BFF — GET /api/indicadores/geral?startDate=...&endDate=...
 * Retorna KPIs consolidados mapeados do endpoint /api/dashboard do backend.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  const { searchParams } = req.nextUrl
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const params = new URLSearchParams()
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)

  const reqHeaders: Record<string, string> = {}
  if (token) reqHeaders["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BACKEND_URL}/api/dashboard?${params.toString()}`, {
    headers: reqHeaders,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)

  if (!res || !res.ok) {
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
