import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)
    if (!token) return NextResponse.json({ success: false, data: [] }, { status: 401 })

    const { searchParams } = req.nextUrl
    const params = new URLSearchParams()
    for (const key of ["period", "month", "year", "startDate", "endDate"]) {
      const v = searchParams.get(key)
      if (v) params.set(key, v)
    }

    const res = await fetch(`${BACKEND_URL}/api/ranking/performance?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)

    if (!res || !res.ok) {
      return NextResponse.json({ success: false, data: [] }, { status: 200 })
    }

    const data = await res.json().catch(() => null)
    return NextResponse.json(data ?? { success: false, data: [] })
  } catch {
    return NextResponse.json({ success: false, data: [] }, { status: 200 })
  }
}
