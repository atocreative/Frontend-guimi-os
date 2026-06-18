import { NextResponse } from "next/server"
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

export async function GET() {
  const session = await getSession()
  const token = getSessionAccessToken(session)
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

  try {
    const res = await fetch(`${BACKEND_URL}/api/operacao/top-products?limit=10`, {
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
