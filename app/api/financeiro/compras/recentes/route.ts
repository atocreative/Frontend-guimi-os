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

  if (!token) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const startDate = searchParams.get("startDate")

  const params = new URLSearchParams()
  if (startDate) {
    const d = new Date(startDate)
    if (!isNaN(d.getTime())) {
      params.set("month", String(d.getMonth() + 1))
      params.set("year", String(d.getFullYear()))
    }
  }

  const res = await fetch(
    `${BACKEND_URL}/api/financeiro/compras/recentes?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }
  ).catch(() => null)

  if (!res || !res.ok) {
    return NextResponse.json({ data: [], error: "COMPRAS_UNAVAILABLE" }, { status: 502 })
  }

  const json = await res.json().catch(() => null)
  if (!json) {
    return NextResponse.json({ data: [], error: "COMPRAS_PARSE_ERROR" }, { status: 502 })
  }

  const data: unknown[] = Array.isArray(json) ? json : (json?.data ?? json?.raw ?? [])
  if (data.length > 0) console.log("[compras/recentes] shape sample:", JSON.stringify(data[0], null, 2))
  return NextResponse.json({ data })
}
