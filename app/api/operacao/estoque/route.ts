import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

/**
 * BFF — GET /api/operacao/estoque
 * Proxy para /dashboard/inventory do backend.
 * Retorna: { valorTotalEstoque, itens }
 */
export async function GET(_req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const res = await fetch(
    `${BACKEND_URL}/dashboard/inventory`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }
  ).catch(() => null)

  if (!res || !res.ok) {
    return NextResponse.json(
      { valorTotalEstoque: 0, itens: [], error: "ESTOQUE_UNAVAILABLE" },
      { status: 502 }
    )
  }

  const data = await res.json().catch(() => null)
  if (!data) {
    return NextResponse.json(
      { valorTotalEstoque: 0, itens: [], error: "ESTOQUE_PARSE_ERROR" },
      { status: 502 }
    )
  }

  // Normaliza: aceita array direto, { data: [] } ou { totalValue, items }
  const itens: any[] = Array.isArray(data) ? data : (data?.data ?? data?.items ?? [])

  // Se o backend já enviar um total consolidado, usa direto
  const valorTotalEstoque =
    Number(data?.totalValue ?? data?.valorTotal ?? data?.valorTotalEstoque ?? 0) ||
    itens.reduce(
      (acc, item) =>
        acc +
        Number(item?.totalValue ?? item?.valor ?? item?.value ?? 0) *
          (item?.totalValue != null ? 1 : Number(item?.quantity ?? item?.quantidade ?? 1)),
      0
    )

  return NextResponse.json({ valorTotalEstoque, itens })
}
