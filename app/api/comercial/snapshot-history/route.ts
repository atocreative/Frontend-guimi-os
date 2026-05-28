import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"
import type { NextRequest } from "next/server"
import type {
  ComercialHistory, HistoryPoint, HistoryGranularity,
} from "@/lib/services/comercial-history.service"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

function extractArray(data: any, ...keys: string[]): any[] {
  if (Array.isArray(data)) return data
  for (const k of keys) {
    if (Array.isArray(data?.[k])) return data[k]
  }
  return []
}

async function fetchBackend(token: string, params: URLSearchParams): Promise<any> {
  const url = new URL(`${BACKEND_URL}/api/comercial/snapshot-history`)
  params.forEach((v, k) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null)
  if (!res?.ok) return null
  return res.json().catch(() => null)
}

function parsePoints(raw: any, granularity: HistoryGranularity): HistoryPoint[] {
  const rawPoints = extractArray(raw, "points", "data", "snapshots", "history", "items")
  const mapped: HistoryPoint[] = rawPoints
    .map((p: any) => ({
      date: String(p.date ?? p.data ?? p.timestamp ?? p.createdAt ?? "").slice(0, 10),
      leadsAtivos:        Number(p.leadsAtivos        ?? p.activeLeads      ?? p.kpis?.leadsAtivos        ?? 0),
      leadsGanhos:        Number(p.leadsGanhos        ?? p.wonLeads         ?? p.kpis?.leadsGanhos        ?? 0),
      leadsPerdidos:      Number(p.leadsPerdidos      ?? p.lostLeads        ?? p.kpis?.leadsPerdidos      ?? 0),
      taxaConversao:      p.taxaConversao             ?? p.conversionRate   ?? p.kpis?.taxaConversao      ?? undefined,
      conversasAtuais:    p.conversasAtuais           ?? p.totalConversas   ?? p.kpis?.conversasAtuais    ?? undefined,
      chatsSemResposta:   p.chatsSemResposta          ?? p.unansweredChats  ?? p.kpis?.chatsSemResposta   ?? undefined,
      tempoRespostaMedio: p.tempoRespostaMedio        ?? p.avgResponseTime  ?? p.kpis?.tempoRespostaMedio ?? undefined,
    }))
    .filter((p) => !!p.date)
    .sort((a, b) => a.date.localeCompare(b.date))

  // Dedup por chave temporal (mantém último valor da janela)
  const bucket = new Map<string, HistoryPoint>()
  for (const pt of mapped) {
    const key = granularity === "mes" ? pt.date.slice(0, 7) : pt.date.slice(0, 10)
    bucket.set(key, { ...pt, date: granularity === "mes" ? `${key}-01` : key })
  }
  return Array.from(bucket.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const reqParams = new URLSearchParams()
  req.nextUrl.searchParams.forEach((v, k) => reqParams.set(k, v))

  const wantsDay = reqParams.has("day")
  const dayParam = reqParams.get("day") ?? ""

  let raw = await fetchBackend(token, reqParams)
  let granularity: HistoryGranularity = wantsDay ? "dia" : "mes"
  let points = raw ? parsePoints(raw, granularity) : []
  let fallbackUsed = false

  // Fallback automático: se dia pedido e sem pontos → tenta o mês correspondente
  if (wantsDay && points.length === 0 && /^\d{4}-\d{2}-\d{2}$/.test(dayParam)) {
    const fallbackParams = new URLSearchParams()
    fallbackParams.set("month", dayParam.slice(0, 7))
    reqParams.forEach((v, k) => { if (k !== "day") fallbackParams.set(k, v) })
    const rawFb = await fetchBackend(token, fallbackParams)
    if (rawFb) {
      raw = rawFb
      granularity = "mes"
      points = parsePoints(raw, granularity)
      fallbackUsed = true
    }
  }

  if (!raw) {
    return NextResponse.json({ error: "HISTORY_UNAVAILABLE" }, { status: 503 })
  }

  const body: ComercialHistory & { fallbackUsed?: boolean } = {
    granularity,
    points,
    fallbackUsed,
  }

  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } })
}
