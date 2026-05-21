import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
).replace(/\/$/, "")

const FINANCIAL_ROLES = new Set(["SUPER_USER", "ADMIN", "GESTOR", "GERENTE"])

export async function POST(_req: NextRequest) {
  const session = await getSession()
  const userRole: string = (session?.user as any)?.role ?? "COLABORADOR"
  const isSuperUser: boolean = Boolean((session?.user as any)?.isSuperUser)

  if (!FINANCIAL_ROLES.has(userRole) && !isSuperUser) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const token = getSessionAccessToken(session)
  if (!token) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const res = await fetch(`${BACKEND_URL}/api/operacao/inventory/sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(120_000), // sync pode demorar
  }).catch((err) => {
    console.error("[BFF:sync] fetch error:", err?.message)
    return null
  })

  if (!res) {
    return NextResponse.json({ error: "BACKEND_UNREACHABLE" }, { status: 502 })
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`[BFF:sync] backend error ${res.status}: ${body.slice(0, 200)}`)
    return NextResponse.json({ error: "SYNC_FAILED" }, { status: res.status })
  }

  const data = await res.json().catch(() => null)
  return NextResponse.json(data ?? { ok: true })
}
