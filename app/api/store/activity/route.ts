import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export async function GET() {
  const session = await getSession()
  const token = getSessionAccessToken(session)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/tasks/history?limit=5`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      }
    ).catch(() => null)

    if (!res?.ok) return NextResponse.json({ data: [] })

    const json = await res.json().catch(() => null)
    const entries = Array.isArray(json?.data) ? json.data : []

    return NextResponse.json({
      data: entries.map((e: any) => ({
        id: e.id,
        action: e.action,
        performedBy: e.performedBy ?? null,
        task: e.task ?? null,
        createdAt: e.createdAt,
      })),
    })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
