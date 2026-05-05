import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const FONE_NINJA_URL =
  "https://api.fone.ninja/erp/api/lojas/guimicell/dashboard/inventory"

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)

    if (!token) {
      return NextResponse.json({ totalEstoque: 0, itens: [] }, { status: 200 })
    }

    const res = await fetch(FONE_NINJA_URL, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)

    if (!res || !res.ok) {
      return NextResponse.json({ totalEstoque: 0, itens: [] }, { status: 200 })
    }

    const data = await res.json().catch(() => null)
    if (!data || !Array.isArray(data.data)) {
      return NextResponse.json({ totalEstoque: 0, itens: [] }, { status: 200 })
    }

    const total = data.data.reduce((acc: number, item: any) => {
      return acc + Number(item.valor_estoque || 0)
    }, 0)

    return NextResponse.json({ totalEstoque: total, itens: data.data })
  } catch {
    return NextResponse.json({ totalEstoque: 0, itens: [] }, { status: 200 })
  }
}
