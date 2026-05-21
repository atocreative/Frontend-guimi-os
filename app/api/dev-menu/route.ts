import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"
import { normalizeDevMenuItems } from "@/lib/feature-definitions"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export async function GET() {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    return NextResponse.json(normalizeDevMenuItems([]), { status: 200 })
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/dev-menu`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    }).catch(() => null)

    if (!res || !res.ok) {
      console.warn(`[BFF /api/dev-menu] Backend unavailable (${res?.status ?? "ECONNREFUSED"})`)
      return NextResponse.json(normalizeDevMenuItems([]), { status: 200 })
    }

    const data = await res.json().catch(() => null)
    const raw = Array.isArray(data) ? data : (data?.data || data?.menu || [])
    return NextResponse.json(normalizeDevMenuItems(raw))
  } catch (err) {
    console.warn("[BFF /api/dev-menu] Unexpected error:", err)
    return NextResponse.json(normalizeDevMenuItems([]), { status: 200 })
  }
}
