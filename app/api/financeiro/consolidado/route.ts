import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)
  if (!token) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const month = searchParams.get("month")
  const year  = searchParams.get("year")

  const qs = month && year ? `?month=${month}&year=${year}` : ""
  const upstream = `${BACKEND_URL}/api/financeiro/consolidado${qs}`

  const res = await fetch(upstream, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  }).catch((e) => {
    console.error("[BFF consolidado] fetch error:", e?.message)
    return null
  })

  if (!res?.ok) {
    console.warn(`[BFF consolidado] upstream HTTP ${res?.status ?? "no-response"}`)
    return NextResponse.json({ error: "CONSOLIDADO_UNAVAILABLE" }, { status: res?.status ?? 502 })
  }

  const data = await res.json().catch(() => null)
  if (!data) return NextResponse.json({ error: "CONSOLIDADO_PARSE_ERROR" }, { status: 502 })

  return NextResponse.json(data)
}
