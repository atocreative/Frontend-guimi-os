import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export interface FinanceiroHealthPayload {
  fn:       { status: "ok" | "degraded" | "down"; lastSync?: string | null; isStable: boolean; sourceType?: string | null }
  ma:       { status: "ok" | "degraded" | "down"; lastSync?: string | null; isStable: boolean }
  snapshot: { status: "ok" | "degraded" | "down"; lastSync?: string | null; isStable: boolean }
  overall:  "ok" | "degraded" | "down"
  isStable: boolean
}

const FALLBACK: FinanceiroHealthPayload = {
  fn:       { status: "degraded", isStable: false },
  ma:       { status: "degraded", isStable: false },
  snapshot: { status: "degraded", isStable: false },
  overall:  "degraded",
  isStable: false,
}

export async function GET() {
  const session = await getSession()
  const token = getSessionAccessToken(session)
  if (!token) return NextResponse.json(FALLBACK, { status: 200 })

  try {
    const res = await fetch(`${BACKEND_URL}/api/financeiro/health`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    })

    if (res.ok) {
      const data = await res.json().catch(() => null)
      if (data) return NextResponse.json(data)
    }

    // Backend doesn't expose health — derive from consolidado
    const consolidadoRes = await fetch(`${BACKEND_URL}/api/financeiro/consolidado`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    }).catch(() => null)

    if (!consolidadoRes?.ok) return NextResponse.json(FALLBACK)

    const consolidado = await consolidadoRes.json().catch(() => null)
    if (!consolidado) return NextResponse.json(FALLBACK)

    const fnSt = consolidado?.breakdown?.fn?.sourceType ?? null
    const fnOk = fnSt === "live" || fnSt === "snapshot"
    const maOk = (consolidado?.breakdown?.meuAssessor?.count ?? 0) > 0
    const snapshotOk = fnSt === "snapshot" || fnSt === "live"

    const payload: FinanceiroHealthPayload = {
      fn: {
        status:     fnOk ? "ok" : "degraded",
        lastSync:   consolidado?.breakdown?.fn?.updatedAt ?? null,
        isStable:   fnOk,
        sourceType: fnSt,
      },
      ma: {
        status:   maOk ? "ok" : "degraded",
        isStable: maOk,
      },
      snapshot: {
        status:   snapshotOk ? "ok" : "degraded",
        isStable: snapshotOk,
      },
      overall:  fnOk && maOk ? "ok" : "degraded",
      isStable: fnOk && maOk,
    }

    return NextResponse.json(payload)
  } catch {
    return NextResponse.json(FALLBACK)
  }
}
