import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
).replace(/\/$/, "")

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function GET() {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!BACKEND_URL) return NextResponse.json({ data: [] })

  try {
    const token = getSessionAccessToken(session)
    const res = await fetch(`${BACKEND_URL}/api/processos/materiais`, {
      headers: authHeaders(token),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return NextResponse.json({ data: [] })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ data: [] })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role: string = (session.user as any).role ?? "COLABORADOR"
  if (!["ADMIN", "GERENTE", "SUPER_USER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!BACKEND_URL) {
    return NextResponse.json({ error: "Backend não configurado" }, { status: 501 })
  }

  try {
    const token = getSessionAccessToken(session)
    const body = await req.formData()
    const res = await fetch(`${BACKEND_URL}/api/processos/materiais`, {
      method: "POST",
      headers: authHeaders(token),
      body,
      signal: AbortSignal.timeout(30_000),
    })
    const json = await res.json().catch(() => ({}))
    return NextResponse.json(json, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role: string = (session.user as any).role ?? "COLABORADOR"
  if (!["ADMIN", "GERENTE", "SUPER_USER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!BACKEND_URL) {
    return NextResponse.json({ error: "Backend não configurado" }, { status: 501 })
  }

  try {
    const token = getSessionAccessToken(session)
    const id = req.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

    const res = await fetch(`${BACKEND_URL}/api/processos/materiais/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(token),
      signal: AbortSignal.timeout(10_000),
    })
    return NextResponse.json({}, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 })
  }
}
