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
  const now = new Date()
  const month = searchParams.get("month") ?? String(now.getMonth() + 1)
  const year = searchParams.get("year") ?? String(now.getFullYear())
  const date = searchParams.get("date")

  const session = await getSession()
  const token = getSessionAccessToken(session)
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

  const qs = new URLSearchParams({ month, year })
  if (date) qs.set("date", date)

  const url = `${BACKEND_URL}/api/dashboard/alert-hub?${qs}`

  try {
    const backendRes = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })

    if (!backendRes.ok) {
      console.error(`[BFF_DASH_ALERT_HUB] Error status=${backendRes.status} url=${url}`)
      return NextResponse.json(
        { error: "ALERT_HUB_FAILED", status: backendRes.status },
        { status: 502 }
      )
    }

    const data = await backendRes.json()

    // Map topAlerts → attentionItems when backend hasn't migrated yet
    if (!data.attentionItems?.length && data.topAlerts?.length) {
      data.attentionItems = data.topAlerts.map((a: Record<string, unknown>) => ({
        id: a.id,
        area: a.area,
        type: a.type,
        severity: a.severity,
        score: a.score ?? 0,
        title: a.title,
        impact: a.impact ?? a.message ?? "",
        recommendation: a.recommendation ?? "",
        actionLabel: a.actionLabel ?? "Ver detalhes",
        actionHref: a.actionHref ?? "#",
        confidence: a.confidence ?? "medium",
      }))
    }

    const attentionCount = data.attentionItems?.length ?? 0
    const chipsCount = data.summaryChips?.length ?? 0
    console.log(`[BFF_DASH_ALERT_HUB] attentionItems=${attentionCount} summaryChips=${chipsCount}`)

    return NextResponse.json(data)
  } catch (err) {
    console.error(`[BFF_DASH_ALERT_HUB] Fetch error url=${url}`, err)
    return NextResponse.json({ error: "FETCH_FAILED" }, { status: 502 })
  }
}
