import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export interface MostSoldItem {
  productName: string
  quantidadeVendida: number
  receitaTotal: number | null
  ticketMedio: number | null
  margemMedia: number | null
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

  const { searchParams } = req.nextUrl
  const tipo = searchParams.get("tipo") ?? ""
  const sort = searchParams.get("sort") ?? "quantidadeVendida"
  const order = searchParams.get("order") ?? "desc"

  try {
    const qs = new URLSearchParams({ limit: "10" })
    if (tipo) qs.set("tipo", tipo)
    if (sort) qs.set("sort", sort)
    if (order) qs.set("order", order)

    const res = await fetch(`${BACKEND_URL}/api/operacao/top-products?${qs}`, {
      headers, cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)

    if (!res?.ok) return NextResponse.json({ data: null })

    const json = await res.json().catch(() => null)
    const raw = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : null

    if (!raw || raw.length === 0) return NextResponse.json({ data: null })

    const items: MostSoldItem[] = raw.map((item: Record<string, unknown>) => ({
      productName: String(item.productName ?? item.nome ?? item.titulo ?? "—"),
      quantidadeVendida: Number(item.quantidadeVendida ?? item.quantidade ?? 0),
      receitaTotal: item.receitaTotal != null ? Number(item.receitaTotal) : null,
      ticketMedio: item.ticketMedio != null ? Number(item.ticketMedio) : null,
      margemMedia: item.margemMedia != null ? Number(item.margemMedia) : null,
    }))

    return NextResponse.json({ data: items })
  } catch {
    return NextResponse.json({ data: null })
  }
}
