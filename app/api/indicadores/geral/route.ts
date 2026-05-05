import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

/**
 * BFF — GET /api/indicadores/geral?startDate=...&endDate=...
 * Consolida KPIs reais em um único endpoint via Promise.all.
 * Retorna: { faturamento, despesas, compras, lucro, ticketMedio, estoqueTotal, conversao }
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const periodoParams = new URLSearchParams()
  if (startDate) periodoParams.set("startDate", startDate)
  if (endDate) periodoParams.set("endDate", endDate)
  const periodoStr = periodoParams.toString()

  const authHeader = { Authorization: `Bearer ${token}` }
  const fetchOpts = { headers: authHeader, cache: "no-store" as const, signal: AbortSignal.timeout(10_000) }

  // Busca todas as fontes em paralelo
  const [overviewRes, despesasRes, comprasRes, estoqueRes, vendasRes] = await Promise.allSettled([
    fetch(`${BACKEND_URL}/api/financeiro/overview?${periodoStr}`, fetchOpts).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${BACKEND_URL}/payments-by-account-plan/pagar?${periodoStr}`, fetchOpts).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${BACKEND_URL}/dashboard/compras?${periodoStr}`, fetchOpts).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${BACKEND_URL}/dashboard/inventory`, fetchOpts).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${BACKEND_URL}/vendas?page=1&perPage=100&sort=data_saida:desc&${periodoStr}`, fetchOpts).then(r => r.ok ? r.json() : null).catch(() => null),
  ])

  const overview = overviewRes.status === "fulfilled" ? overviewRes.value : null
  const despesasData = despesasRes.status === "fulfilled" ? despesasRes.value : null
  const comprasData = comprasRes.status === "fulfilled" ? comprasRes.value : null
  const estoqueData = estoqueRes.status === "fulfilled" ? estoqueRes.value : null
  const vendasData = vendasRes.status === "fulfilled" ? vendasRes.value : null

  // ── Vendas reais ─────────────────────────────────────────────────────────────
  const vendasRaw: any[] = Array.isArray(vendasData) ? vendasData : (vendasData?.data ?? [])
  const totalVendas = vendasRaw.length
  const faturamentoVendas = vendasRaw.reduce((acc, item) => acc + Number(item?.valor_total || 0), 0)

  // ── Faturamento ─────────────────────────────────────────────────────────────
  const faturamento = faturamentoVendas || Number(overview?.resumo?.faturamentoMes ?? 0)
  const countVendas = totalVendas || Number(overview?.count ?? 0)

  // ── Conversão ───────────────────────────────────────────────────────────────
  const overviewVendas: any[] = overview?.data ?? []
  const completed = overviewVendas.filter((v: any) => v?.status === "completed").length
  const pending = overviewVendas.filter((v: any) => v?.status === "pending").length
  const conversao = (completed + pending) > 0 ? completed / (completed + pending) : 0

  // ── Despesas ────────────────────────────────────────────────────────────────
  const despesasRaw: any[] = Array.isArray(despesasData) ? despesasData : (despesasData?.data ?? [])
  const despesas = despesasRaw.reduce(
    (acc, item) => acc + Number(item?.valor || 0),
    0
  )

  // ── Compras ─────────────────────────────────────────────────────────────────
  const comprasRaw: any[] = Array.isArray(comprasData) ? comprasData : (comprasData?.data ?? [])
  const compras = comprasRaw.reduce((acc, item) => acc + Number(item?.valor_total || 0), 0)

  // ── Estoque ─────────────────────────────────────────────────────────────────
  const estoqueItens: any[] = Array.isArray(estoqueData) ? estoqueData : (estoqueData?.data ?? estoqueData?.items ?? [])
  const estoqueTotal =
    Number(estoqueData?.totalValue ?? estoqueData?.valorTotal ?? 0) ||
    estoqueItens.reduce(
      (acc, item) =>
        acc + Number(item?.totalValue ?? item?.valor ?? item?.value ?? 0) *
          (item?.totalValue != null ? 1 : Number(item?.quantity ?? item?.quantidade ?? 1)),
      0
    )

  // ── Cálculos finais ─────────────────────────────────────────────────────────
  const lucro = faturamento - despesas - compras
  const ticketMedio = countVendas > 0 ? faturamento / countVendas : 0

  return NextResponse.json({
    faturamento,
    despesas,
    compras,
    lucro,
    ticketMedio,
    totalVendas: countVendas,
    estoqueTotal,
    conversao,
    _meta: {
      sources: {
        overview: !!overview,
        despesas: !!despesasData,
        compras: !!comprasData,
        estoque: !!estoqueData,
        vendas: !!vendasData,
      },
    },
  })
}
