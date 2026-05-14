import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined")
  return url.replace(/\/$/, "")
})()

export async function GET(_req: NextRequest) {
  try {
    const reqHeaders: Record<string, string> = {}
    try {
      const session = await getSession()
      const token = getSessionAccessToken(session)
      if (token) reqHeaders["Authorization"] = `Bearer ${token}`
    } catch {
      // proceed without auth
    }

    const res = await fetch(`${BACKEND_URL}/api/operacao/inventory`, {
      headers: reqHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)

    if (!res) {
      return NextResponse.json(
        { totalEstoque: 0, itens: [], error: "INVENTORY_UNAVAILABLE", pending: false },
        { status: 502 }
      )
    }

    if (!res.ok) {
      return NextResponse.json(
        { totalEstoque: 0, itens: [], error: "INVENTORY_UPSTREAM_ERROR", pending: false },
        { status: res.status }
      )
    }

    const data = await res.json().catch(() => null)
    if (!data) {
      return NextResponse.json(
        { totalEstoque: 0, itens: [], error: "INVENTORY_PARSE_ERROR", pending: false },
        { status: 502 }
      )
    }

    // Backend returns { data: [...] } with items: { id, titulo, estoque, preco_varejo, ... }
    const itens: any[] = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.itens)
        ? data.itens
        : []

    const total = itens.reduce((acc: number, item: any) => {
      const valorEstoque = Number(item.valor_estoque ?? 0)
      if (valorEstoque > 0) return acc + valorEstoque
      return acc + Number(item.estoque ?? 0) * Number(item.preco_varejo ?? 0)
    }, 0)

    return NextResponse.json({ totalEstoque: total, itens, error: null, pending: false })
  } catch {
    return NextResponse.json(
      { totalEstoque: 0, itens: [], error: "INVENTORY_UNAVAILABLE", pending: false },
      { status: 502 }
    )
  }
}
