import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "")

/**
 * BFF — GET /api/financeiro/despesas?startDate=...&endDate=...
 * Proxy para /api/financeiro/despesas do backend (PostgreSQL).
 * Retorna: { total, raw }
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const startDate = searchParams.get("startDate")

  // Extrai month/year do startDate (o endpoint despesas usa month/year)
  const params = new URLSearchParams()
  if (startDate) {
    const d = new Date(startDate)
    if (!isNaN(d.getTime())) {
      params.set("month", String(d.getMonth() + 1))
      params.set("year", String(d.getFullYear()))
    }
  }

  const res = await fetch(
    `${BACKEND_URL}/api/financeiro/despesas?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }
  ).catch(() => null)

  if (!res || !res.ok) {
    return NextResponse.json(
      { total: 0, raw: [], error: "DESPESAS_UNAVAILABLE" },
      { status: 502 }
    )
  }

  const data = await res.json().catch(() => null)
  if (!data) {
    return NextResponse.json(
      { total: 0, raw: [], error: "DESPESAS_PARSE_ERROR" },
      { status: 502 }
    )
  }

  const raw: any[] = Array.isArray(data) ? data : (data?.data ?? [])
  const total = raw.reduce((acc, item) => acc + Number(item?.amount ?? item?.valor ?? 0), 0)

  return NextResponse.json({ total, raw })
}
