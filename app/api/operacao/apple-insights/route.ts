import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || ""
).replace(/\/$/, "")

async function buildHeaders(): Promise<Record<string, string>> {
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)
    if (token) return { Authorization: `Bearer ${token}` }
  } catch {}
  return {}
}

export async function GET(_req: NextRequest) {
  const t0 = Date.now()
  try {
    const headers = await buildHeaders()
    const url = `${BACKEND_URL}/api/operacao/apple-insights`

    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null)

    if (!res) {
      console.error(`[BFF:apple-insights] backend unreachable (${Date.now() - t0}ms)`)
      return NextResponse.json({ data: null, _meta: { error: "BACKEND_UNREACHABLE" } }, { status: 502 })
    }

    if (!res.ok) {
      return NextResponse.json({ data: null, _meta: { error: `BACKEND_${res.status}` } }, { status: res.status })
    }

    const data = await res.json().catch(() => null)
    if (!data) return NextResponse.json({ data: null, _meta: { error: "PARSE_ERROR" } }, { status: 502 })

    console.log(`[BFF:apple-insights] ✓ (${Date.now() - t0}ms)`)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ data: null, _meta: { error: err?.message } }, { status: 502 })
  }
}
