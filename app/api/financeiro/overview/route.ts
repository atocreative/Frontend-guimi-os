import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined")
  return url.replace(/\/$/, "")
})()

/**
 * BFF — GET /api/financeiro/overview?startDate=...&endDate=...
 * Proxy para o endpoint de overview do backend.
 * Retorna: { resumo, grafico }
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
    `${BACKEND_URL}/api/financeiro/overview?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }
  ).catch(() => null)

  if (!res || !res.ok) {
    return NextResponse.json(
      { error: "OVERVIEW_UNAVAILABLE", status: res?.status ?? 503 },
      { status: 502 }
    )
  }

  const data = await res.json().catch(() => null)
  if (!data) {
    return NextResponse.json({ error: "OVERVIEW_PARSE_ERROR" }, { status: 502 })
  }

  const vendas = data.data || []
  const completed = vendas.filter((v: any) => v?.status === "completed").length
  const pending = vendas.filter((v: any) => v?.status === "pending").length
  
  const conversao = (completed + pending) > 0
    ? completed / (completed + pending)
    : 0

  if (data.resumo) {
    data.resumo.conversao = conversao
  }

  return NextResponse.json(data)
}
