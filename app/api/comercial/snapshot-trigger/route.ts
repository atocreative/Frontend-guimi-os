import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"
import type { NextRequest } from "next/server"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export async function POST(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    return NextResponse.json({ error: "Unauthorized", message: "No token in session" }, { status: 401 })
  }

  let body: unknown = undefined
  try {
    const text = await req.text()
    if (text) body = JSON.parse(text)
  } catch {
    // no body
  }

  const res = await fetch(`${BACKEND_URL}/api/comercial/snapshot-trigger`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null)

  if (!res) {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE" }, { status: 503 })
  }

  const data = await res.json().catch(() => null)

  return NextResponse.json(data ?? { error: "INVALID_RESPONSE" }, { status: res.status })
}
