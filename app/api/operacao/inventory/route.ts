import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined")
  return url.replace(/\/$/, "")
})()

async function buildHeaders(): Promise<Record<string, string>> {
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)
    if (token) return { Authorization: `Bearer ${token}` }
  } catch {
    // sem auth
  }
  return {}
}

export async function GET(req: NextRequest) {
  const t0 = Date.now()
  const isSummary = req.nextUrl.searchParams.get("summary") === "1"

  try {
    const reqHeaders = await buildHeaders()
    const { searchParams } = req.nextUrl

    const params = new URLSearchParams()
    const allowed = ["page", "perPage", "search", "status", "tipo", "sort", "order"]
    for (const key of allowed) {
      const val = searchParams.get(key)
      if (val) params.set(key, val)
    }

    const endpoint = isSummary
      ? `${BACKEND_URL}/api/operacao/inventory/summary`
      : `${BACKEND_URL}/api/operacao/inventory?${params.toString()}`

    console.log(`[BFF:inventory] → ${endpoint}`)

    const res = await fetch(endpoint, {
      headers: reqHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    }).catch((err) => {
      console.error(`[BFF:inventory] fetch error: ${err?.message} (${Date.now() - t0}ms)`)
      return null
    })

    if (!res) {
      console.error(`[BFF:inventory] UNAVAILABLE — backend unreachable (${Date.now() - t0}ms)`)
      return NextResponse.json(
        { data: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 }, error: "UNAVAILABLE" },
        { status: 502 }
      )
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[BFF:inventory] UPSTREAM_ERROR status=${res.status} body=${body.slice(0, 200)} (${Date.now() - t0}ms)`)
      return NextResponse.json(
        { data: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 }, error: "UPSTREAM_ERROR" },
        { status: res.status }
      )
    }

    const data = await res.json().catch((err) => {
      console.error(`[BFF:inventory] PARSE_ERROR: ${err?.message}`)
      return null
    })

    if (!data) {
      return NextResponse.json(
        { data: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 }, error: "PARSE_ERROR" },
        { status: 502 }
      )
    }

    const count = Array.isArray(data.data) ? data.data.length : "—"
    console.log(`[BFF:inventory] ✓ items=${count} total=${data.pagination?.total ?? "—"} source=${data._meta?.source ?? "?"} (${Date.now() - t0}ms)`)

    return NextResponse.json(data)
  } catch (err: any) {
    console.error(`[BFF:inventory] unhandled error: ${err?.message} (${Date.now() - t0}ms)`)
    return NextResponse.json(
      { data: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 }, error: "UNAVAILABLE" },
      { status: 502 }
    )
  }
}
