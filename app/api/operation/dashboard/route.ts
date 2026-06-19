import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MostSoldItemFN {
  rank: number
  productName: string
  quantitySold: number
  category?: string | null
}

export interface InventoryItemFN {
  productName: string
  category: string | null
  quantity: number
  stockValue: number | null
}

export interface InventoryFN {
  totalQuantity: number | null
  totalValue: number | null
  items: InventoryItemFN[]
  source?: string
  stale: boolean
  staleReason?: string | null
  syncedAt: string | null
}

export interface AlertItem {
  id?: string
  produto: string
  estoque?: number | null
  vendas30d?: number | null
  diasParado?: number | null
  valorParado?: number | null
  sugestao?: string | null
}

export interface OperationalInsight {
  type: "success" | "warning" | "danger" | "info"
  title: string
  message: string
  recommendation?: string | null
}

export interface OperationalAlerts {
  criticalStock: AlertItem[]
  recommendedRestock: AlertItem[]
  slowMovingStock: AlertItem[]
  insights: OperationalInsight[]
}

export interface OperationDashboardPayload {
  inventory: InventoryFN
  mostSoldItems: MostSoldItemFN[]
  operationalAlerts: OperationalAlerts
  sources?: Record<string, string>
  stale: boolean
  staleReason: string | null
  syncedAt: string | null
  generatedAt?: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeInventoryItem(raw: Record<string, unknown>): InventoryItemFN {
  return {
    productName: String(raw.productName ?? raw.titulo ?? raw.nome ?? "—"),
    category:    raw.category != null ? String(raw.category) : raw.categoria != null ? String(raw.categoria) : null,
    quantity:    Number(raw.quantity ?? raw.estoque ?? raw.qty ?? 0),
    stockValue:  raw.stockValue != null ? Number(raw.stockValue)
                 : raw.valor_estoque != null ? Number(raw.valor_estoque)
                 : raw.valorEstoque != null ? Number(raw.valorEstoque)
                 : null,
  }
}

function normalizeAlertItem(raw: Record<string, unknown>): AlertItem {
  return {
    id:         raw.id != null ? String(raw.id) : undefined,
    produto:    String(raw.produto ?? raw.productName ?? raw.titulo ?? raw.nome ?? "—"),
    estoque:    raw.estoque != null ? Number(raw.estoque) : raw.quantity != null ? Number(raw.quantity) : null,
    vendas30d:  raw.vendas30d != null ? Number(raw.vendas30d) : raw.sales30d != null ? Number(raw.sales30d) : null,
    diasParado: raw.diasParado != null ? Number(raw.diasParado) : raw.daysStale != null ? Number(raw.daysStale) : null,
    valorParado: raw.valorParado != null ? Number(raw.valorParado) : raw.staleValue != null ? Number(raw.staleValue) : null,
    sugestao:   raw.sugestao != null ? String(raw.sugestao) : raw.action != null ? String(raw.action) : raw.suggestedAction != null ? String(raw.suggestedAction) : null,
  }
}

function normalizeAlerts(raw: unknown): OperationalAlerts {
  if (!raw || typeof raw !== "object") {
    return { criticalStock: [], recommendedRestock: [], slowMovingStock: [], insights: [] }
  }
  const r = raw as Record<string, unknown>
  const toArr = (v: unknown) => (Array.isArray(v) ? v : [])
  return {
    criticalStock:      toArr(r.criticalStock).map((x) => normalizeAlertItem(x as Record<string, unknown>)),
    recommendedRestock: toArr(r.recommendedRestock).map((x) => normalizeAlertItem(x as Record<string, unknown>)),
    slowMovingStock:    toArr(r.slowMovingStock).map((x) => normalizeAlertItem(x as Record<string, unknown>)),
    insights:           toArr(r.insights) as OperationalInsight[],
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const now = new Date()
  const month      = searchParams.get("month")      ?? String(now.getMonth() + 1)
  const year       = searchParams.get("year")       ?? String(now.getFullYear())
  const topFilter  = searchParams.get("topFilter")  ?? ""
  const topLimit   = searchParams.get("topLimit")   ?? "10"

  const session = await getSession()
  const token = getSessionAccessToken(session)
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

  const qs = new URLSearchParams({ month, year, topLimit })
  if (topFilter) qs.set("topFilter", topFilter)

  const url = `${BACKEND_URL}/api/operacao/operation-dashboard?${qs}`

  const backendRes = await fetch(url, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null)

  if (!backendRes || !backendRes.ok) {
    console.error(`[BFF_OPERATION_DASHBOARD] status=${backendRes?.status ?? "no_response"} url=${url}`)
    return NextResponse.json(
      { error: "OPERATION_DASHBOARD_FAILED", status: backendRes?.status ?? 0 },
      { status: 502 }
    )
  }

  const data = await backendRes.json().catch(() => null)
  if (!data) {
    console.error(`[BFF_OPERATION_DASHBOARD] parse_error url=${url}`)
    return NextResponse.json({ error: "PARSE_ERROR" }, { status: 502 })
  }

  // Normalize inventory items
  const rawItems = Array.isArray(data.inventory?.items) ? data.inventory.items : []
  const inventoryItems: InventoryItemFN[] = rawItems.map((x: unknown) =>
    normalizeInventoryItem(x as Record<string, unknown>)
  )

  // Normalize mostSoldItems
  const rawSold = Array.isArray(data.mostSoldItems) ? data.mostSoldItems : []
  const mostSoldItems: MostSoldItemFN[] = rawSold.map((item: Record<string, unknown>, i: number) => ({
    rank:         Number(item.rank ?? i + 1),
    productName:  String(item.productName ?? item.nome ?? item.titulo ?? "—"),
    quantitySold: Number(item.quantidadeVendida ?? item.quantidade ?? item.quantitySold ?? 0),
    category:     item.category != null ? String(item.category) : item.categoria != null ? String(item.categoria) : null,
  }))

  const invQty   = data.inventory?.totalQuantity ?? null
  const invValue = data.inventory?.totalValue ?? null

  console.log(
    `[BFF_OPERATION_DASHBOARD_FIELDS] inventoryQty=${invQty} inventoryValue=${invValue} mostSoldCount=${mostSoldItems.length} inventoryItems=${inventoryItems.length}`
  )

  const payload: OperationDashboardPayload = {
    inventory: {
      totalQuantity: invQty,
      totalValue:    invValue,
      items:         inventoryItems,
      source:        data.inventory?.source     ?? undefined,
      stale:         data.inventory?.stale      ?? false,
      staleReason:   data.inventory?.staleReason ?? null,
      syncedAt:      data.inventory?.syncedAt   ?? null,
    },
    mostSoldItems,
    operationalAlerts: normalizeAlerts(data.operationalAlerts),
    sources:     data.sources     ?? undefined,
    stale:       data.stale       ?? false,
    staleReason: data.staleReason ?? null,
    syncedAt:    data.syncedAt    ?? null,
    generatedAt: data.generatedAt ?? null,
  }

  return NextResponse.json(payload)
}
