import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

const ALLOWED_ROLES = ["SUPER_USER", "ADMIN", "GESTOR", "GERENTE"]

export async function POST() {
  const session = await getSession()
  const token = getSessionAccessToken(session)
  const role: string = (session?.user as any)?.role ?? ""

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Sem permissão para fechar a loja" }, { status: 403 })
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/store/close`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)

    if (!res) {
      return NextResponse.json({ error: "Backend indisponível" }, { status: 503 })
    }

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const message = data?.message || data?.error || `Erro ${res.status}`
      return NextResponse.json({ error: message }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("[BFF /api/store/close] Error:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
