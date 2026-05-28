import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export interface ProcessosDespesaItem {
  id: string
  categoria: string
  descricao: string
  amount: number   // sempre negativo
  data?: string | null
  count: number
}

export interface ProcessosDespesasPayload {
  total: number
  totalAbs: number
  items: ProcessosDespesaItem[]
}

interface BackendCategoria {
  categoria?: string
  count?: number
  valor?: number
}
interface BackendDespesasResponse {
  month?: number
  year?: number
  period?: string
  categorias?: BackendCategoria[]
  total?: number
}

/**
 * BFF — GET /api/processos-financeiros/despesas?month=M&year=Y
 * Upstream: backend /api/processos-financeiros/despesas → { categorias, total }.
 * Mapeia cada categoria em 1 item para a tabela. Domínio MeuAssessor exclusivo.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)
  if (!token) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const month = searchParams.get("month")
  const year  = searchParams.get("year")

  if (!month || !year) {
    return NextResponse.json({ error: "month e year são obrigatórios" }, { status: 400 })
  }

  const upstreamUrl = `${BACKEND_URL}/api/processos-financeiros/despesas?month=${month}&year=${year}`
  console.log(`[BFF despesas] month=${month} year=${year} → ${upstreamUrl}`)

  const res = await fetch(upstreamUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch((e) => {
    console.error("[BFF despesas] fetch error:", e?.message)
    return null
  })

  if (!res?.ok) {
    console.warn(`[BFF despesas] upstream HTTP ${res?.status ?? "no-response"}`)
    return NextResponse.json(
      { total: 0, totalAbs: 0, items: [], error: "DESPESAS_UNAVAILABLE" },
      { status: 502 },
    )
  }

  const data = (await res.json().catch(() => null)) as BackendDespesasResponse | null
  console.log(`[BFF despesas] upstream payload keys=${data ? Object.keys(data).join(",") : "null"} categorias.len=${data?.categorias?.length ?? 0}`)

  if (!data || !Array.isArray(data.categorias)) {
    return NextResponse.json(
      { total: 0, totalAbs: 0, items: [], error: "DESPESAS_PARSE_ERROR" },
      { status: 502 },
    )
  }

  const items: ProcessosDespesaItem[] = data.categorias.map((c, i) => {
    const cat = String(c.categoria ?? "").trim() || "Não classificado"
    const valor = Number(c.valor ?? 0)
    const amount = valor > 0 ? -valor : valor
    const count = Number(c.count ?? 0)
    return {
      id: `${cat}-${i}`,
      categoria: cat,
      descricao: `${count} ${count === 1 ? "transação" : "transações"}`,
      amount,
      count,
      data: `${year}-${String(month).padStart(2, "0")}-01`,
    }
  })

  const totalAbs = items.reduce((s, i) => s + Math.abs(i.amount), 0)
  console.log(`[BFF despesas] mapped items=${items.length} totalAbs=${totalAbs.toFixed(2)} first=${items[0]?.categoria ?? "none"}`)

  return NextResponse.json({ total: -totalAbs, totalAbs, items })
}
