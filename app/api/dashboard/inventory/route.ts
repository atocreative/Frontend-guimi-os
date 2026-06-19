import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export interface InventoryTopItem {
  titulo: string
  valorEstoque: number | null
  estoque: number | null
}

export interface InventoryPayload {
  totalItens: number | null
  totalProdutos: number | null
  valorTotalEstoque: number | null
  topPorValor: InventoryTopItem[] | null
  lastSyncAt: string | null
}

export async function GET() {
  const session = await getSession()
  const token = getSessionAccessToken(session)
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

  try {
    const [summaryRes, topValueRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/operacao/inventory/summary`, {
        headers, cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }).catch(() => null),
      fetch(`${BACKEND_URL}/api/operacao/inventory?sort=valor_estoque&order=desc&perPage=10&page=1`, {
        headers, cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }).catch(() => null),
    ])

    const summary = summaryRes?.ok ? await summaryRes.json().catch(() => null) : null
    const topValue = topValueRes?.ok ? await topValueRes.json().catch(() => null) : null

    const topItems: InventoryTopItem[] | null = Array.isArray(topValue?.data) && topValue.data.length > 0
      ? topValue.data.slice(0, 10).map((item: Record<string, unknown>) => ({
          titulo: String(item.titulo ?? item.productName ?? item.nome ?? "—"),
          valorEstoque: item.valor_estoque != null ? Number(item.valor_estoque) : null,
          estoque: item.estoque != null ? Number(item.estoque) : null,
        }))
      : null

    const payload: InventoryPayload = {
      totalItens: summary?.totalItens != null ? Number(summary.totalItens) : null,
      totalProdutos: summary?.totalProdutos != null ? Number(summary.totalProdutos) : null,
      valorTotalEstoque: summary?.valorTotalEstoque != null ? Number(summary.valorTotalEstoque) : null,
      topPorValor: topItems,
      lastSyncAt: summary?.lastSyncAt ?? null,
    }

    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ error: "INVENTORY_UNAVAILABLE" }, { status: 502 })
  }
}
