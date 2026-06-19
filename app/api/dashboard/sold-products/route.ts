import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const yearParam  = searchParams.get("year")
  const monthParam = searchParams.get("month") // 1-indexed from client

  const now = new Date()
  const year  = yearParam  ? Number(yearParam)  : now.getFullYear()
  const month = monthParam ? Number(monthParam) : now.getMonth() + 1 // 1-indexed

  const reqHeaders: Record<string, string> = {}
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)
    if (token) reqHeaders["Authorization"] = `Bearer ${token}`
  } catch {
    // sem auth — backend decidirá
  }

  try {
    const qs = new URLSearchParams({ month: String(month), year: String(year) })
    const res = await fetch(`${BACKEND_URL}/api/dashboard/sold-products?${qs}`, {
      headers: reqHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      console.error(`[SOLD_PRODUCTS] backend returned ${res.status}`)
      return NextResponse.json({ total: 0 })
    }

    const data = await res.json().catch(() => null)
    // Backend returns: { soldProducts: 155, salesCount: 94, _source: "revenue.quantidadeProdutos" }
    const total = Number(data?.soldProducts ?? 0)

    console.log(`[SOLD_PRODUCTS] payload recebido:`, JSON.stringify(data))
    console.log(`[SOLD_PRODUCTS] valor final calculado: ${total} (salesCount=${data?.salesCount})`)

    return NextResponse.json({ total })
  } catch (e) {
    console.error("[SOLD_PRODUCTS] erro:", e)
    return NextResponse.json({ total: 0 })
  }
}
