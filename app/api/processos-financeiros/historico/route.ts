import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export interface ProcessosHistoricoItem {
  mes: string       // "YYYY-MM"
  entradas: number  // positivo
  despesas: number  // negativo
  saldo: number
  count: number
}

interface BackendHistoricoResponse {
  months?: number
  series?: ProcessosHistoricoItem[]
}

/**
 * BFF — GET /api/processos-financeiros/historico?months=N
 * Upstream: backend /api/processos-financeiros/historico → { months, series }.
 * Devolve N meses de saldo administrativo em 1 chamada.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)
  if (!token) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const months = req.nextUrl.searchParams.get("months") ?? "12"
  const upstreamUrl = `${BACKEND_URL}/api/processos-financeiros/historico?months=${months}`

  const res = await fetch(upstreamUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch((e) => {
    console.error("[BFF historico] fetch error:", e?.message)
    return null
  })

  if (!res?.ok) {
    console.warn(`[BFF historico] upstream HTTP ${res?.status ?? "no-response"}`)
    return NextResponse.json({ series: [] }, { status: 502 })
  }

  const data = (await res.json().catch(() => null)) as BackendHistoricoResponse | null
  const series = Array.isArray(data?.series) ? data!.series : []

  return NextResponse.json({ series })
}
