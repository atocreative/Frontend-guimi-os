import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || ""
).replace(/\/$/, "")

const EMPTY = {
  categoria: "iPhone",
  monthLabel: "",
  prevMonthLabel: "",
  current: null,
  previous: null,
  growthPct: null,
  generatedAt: null,
}

async function buildHeaders(): Promise<Record<string, string>> {
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)
    if (token) return { Authorization: `Bearer ${token}` }
  } catch {}
  return {}
}

export async function GET(_req: NextRequest) {
  if (!BACKEND_URL) return NextResponse.json(EMPTY)

  const t0 = Date.now()
  try {
    const headers = await buildHeaders()
    const res = await fetch(`${BACKEND_URL}/api/operacao/apple-trend`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)

    if (!res || !res.ok) {
      console.warn(`[BFF:apple-trend] backend ${res?.status ?? "unreachable"} (${Date.now() - t0}ms)`)
      return NextResponse.json(EMPTY)
    }

    const data = await res.json().catch(() => null)
    if (!data) return NextResponse.json(EMPTY)

    console.log(`[BFF:apple-trend] ✓ (${Date.now() - t0}ms)`)
    return NextResponse.json(data.data ?? data)
  } catch (err: any) {
    console.error(`[BFF:apple-trend] error: ${err?.message}`)
    return NextResponse.json(EMPTY)
  }
}
