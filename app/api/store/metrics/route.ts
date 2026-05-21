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

  // Midnight São Paulo (UTC-3)
  const now = new Date()
  const spDate = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
  const todayStart = new Date(`${spDate}T00:00:00-03:00`).toISOString()
  const todayEnd = now.toISOString()

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/tasks/metrics?from=${todayStart}&to=${todayEnd}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      }
    ).catch(() => null)

    if (!res?.ok) {
      return NextResponse.json({ createdToday: 0, completedToday: 0, lateToday: 0, pendingToday: 0 })
    }

    const json = await res.json().catch(() => null)
    const d = json?.data ?? json ?? {}

    return NextResponse.json({
      createdToday: d.total ?? 0,
      completedToday: d.concluidas ?? 0,
      lateToday: d.concluidas_atrasadas ?? 0,
      pendingToday: (d.pendentes ?? 0) + (d.em_andamento ?? 0),
    })
  } catch {
    return NextResponse.json({ createdToday: 0, completedToday: 0, lateToday: 0, pendingToday: 0 })
  }
}
