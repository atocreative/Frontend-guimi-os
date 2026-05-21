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

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/store/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    }).catch(() => null)

    if (!res || !res.ok) {
      console.warn(`[BFF /api/store/status] Backend ${res?.status ?? "ECONNREFUSED"}`)
      // 503 so frontend distinguishes "backend unreachable" from "actually FECHADA".
      // refetchAfterAction checks res.ok — a 503 won't overwrite the optimistic state.
      return NextResponse.json(
        { status: "FECHADA", currentOperation: null, lastOperation: null },
        { status: 503 }
      )
    }

    const raw = await res.json().catch(() => null)
    // Unwrap { data: {...} } envelope if backend uses it
    const data = raw?.data ?? raw

    // Backend returns { isOpen: boolean, operation: {...} | null }
    // Frontend expects { status: "ABERTA"|"FECHADA", currentOperation: {...}|null, lastOperation: null }
    if (data && typeof data.isOpen === "boolean") {
      const status = data.isOpen ? "ABERTA" : "FECHADA"
      const op = data.operation ?? null
      const currentOperation = data.isOpen && op
        ? {
            id: op.id,
            status: "ABERTA",
            openedAt: op.openedAt,
            openedBy: op.openedBy,
            closedAt: null,
            closedBy: null,
            durationMinutes: op.durationMinutes ?? null,
            notes: null,
            createdAt: op.openedAt,
          }
        : null
      console.log(`[BFF /api/store/status] isOpen=${data.isOpen} → status=${status}`)
      return NextResponse.json({ status, currentOperation, lastOperation: null })
    }

    // Fallback: pass through if already in expected shape
    return NextResponse.json(data ?? { status: "FECHADA", currentOperation: null, lastOperation: null })
  } catch (err) {
    console.warn("[BFF /api/store/status] Error:", err)
    return NextResponse.json(
      { status: "FECHADA", currentOperation: null, lastOperation: null },
      { status: 503 }
    )
  }
}
