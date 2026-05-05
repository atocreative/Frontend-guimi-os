import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "")

/**
 * BFF — GET /api/financeiro/compras?startDate=...&endDate=...
 * Proxy para /dashboard/compras do backend (custo de mercadoria).
 * Retorna: { totalCompras, raw }
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
    `${BACKEND_URL}/dashboard/compras?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }
  ).catch(() => null)

  if (!res || !res.ok) {
    return NextResponse.json(
      { totalCompras: 0, raw: [], error: "COMPRAS_UNAVAILABLE" },
      { status: 502 }
    )
  }

  const data = await res.json().catch(() => null)
  if (!data) {
    return NextResponse.json(
      { totalCompras: 0, raw: [], error: "COMPRAS_PARSE_ERROR" },
      { status: 502 }
    )
  }

  // Normaliza: aceita array direto, { data: [] } ou { total, data }
  const raw: any[] = Array.isArray(data) ? data : (data?.data ?? [])

  const total = raw.reduce((acc, item) => acc + Number(item?.valor_total || 0), 0)

  return NextResponse.json({ total, raw })
}
