import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined")
  return url.replace(/\/$/, "")
})()

/**
 * BFF — GET /api/comercial/vendas?startDate=...&endDate=...
 * Proxy para /vendas do backend.
 * Retorna: { total, faturamento, ticketMedio, vendas }
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)

    if (!token) {
      return NextResponse.json({ total: 0, faturamento: 0, ticketMedio: 0, vendas: [] }, { status: 200 })
    }

    const { searchParams } = req.nextUrl
    const params = new URLSearchParams({
      page: "1",
      perPage: "100",
      sort: "data_saida:desc",
    })
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)

    const res = await fetch(`${BACKEND_URL}/vendas?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)

    if (!res || !res.ok) {
      return NextResponse.json({ total: 0, faturamento: 0, ticketMedio: 0, vendas: [] }, { status: 200 })
    }

    const data = await res.json().catch(() => null)
    if (!data) {
      return NextResponse.json({ total: 0, faturamento: 0, ticketMedio: 0, vendas: [] }, { status: 200 })
    }

    const vendas: any[] = Array.isArray(data) ? data : (data?.data ?? [])
    const total = vendas.length
    const faturamento = vendas.reduce((acc, item) => acc + Number(item?.valor_total || 0), 0)
    const ticketMedio = total > 0 ? faturamento / total : 0

    return NextResponse.json({ total, faturamento, ticketMedio, vendas })
  } catch {
    return NextResponse.json({ total: 0, faturamento: 0, ticketMedio: 0, vendas: [] }, { status: 200 })
  }
}
