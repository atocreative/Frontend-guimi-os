import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const page = searchParams.get("page") ?? "1"
  const perPage = searchParams.get("perPage") ?? "20"

  try {
    const url = `${BACKEND_URL}/api/store/history?page=${page}&perPage=${perPage}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)

    if (!res || !res.ok) {
      console.warn(`[BFF /api/store/history] Backend ${res?.status ?? "ECONNREFUSED"}`)
      return NextResponse.json(
        { data: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } },
        { status: 200 }
      )
    }

    const data = await res.json().catch(() => null)
    return NextResponse.json(
      data ?? { data: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } }
    )
  } catch (err) {
    console.warn("[BFF /api/store/history] Error:", err)
    return NextResponse.json(
      { data: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } },
      { status: 200 }
    )
  }
}
