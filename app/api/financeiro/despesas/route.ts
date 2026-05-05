import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

/**
 * BFF — GET /api/financeiro/despesas?startDate=...&endDate=...
 * Proxy para /payments-by-account-plan/pagar do backend.
 * Retorna: { totalDespesas, categorias, raw }
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const params = new URLSearchParams()
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)

  const res = await fetch(
    `${BACKEND_URL}/payments-by-account-plan/pagar?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }
  ).catch(() => null)

  if (!res || !res.ok) {
    return NextResponse.json(
      { totalDespesas: 0, categorias: [], raw: [], error: "DESPESAS_UNAVAILABLE" },
      { status: 502 }
    )
  }

  const data = await res.json().catch(() => null)
  if (!data) {
    return NextResponse.json(
      { totalDespesas: 0, categorias: [], raw: [], error: "DESPESAS_PARSE_ERROR" },
      { status: 502 }
    )
  }

  // Normaliza: aceita array direto ou { data: [] }
  const raw: any[] = Array.isArray(data) ? data : (data?.data ?? [])

  // Soma total
  const totalDespesas = raw.reduce((acc, item) => acc + Number(item?.amount ?? item?.valor ?? item?.value ?? 0), 0)

  // Agrupa por categoria
  const catMap = new Map<string, number>()
  for (const item of raw) {
    const cat = item?.accountPlan ?? item?.categoria ?? item?.category ?? "Outros"
    catMap.set(cat, (catMap.get(cat) ?? 0) + Number(item?.amount ?? item?.valor ?? item?.value ?? 0))
  }
  const categorias = Array.from(catMap.entries()).map(([categoria, valor]) => ({
    categoria,
    valor,
    percentual: totalDespesas > 0 ? Math.round((valor / totalDespesas) * 100) : 0,
  }))

  return NextResponse.json({ totalDespesas, categorias, raw })
}
