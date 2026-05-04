import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ featureId: string }> }
) {
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { featureId } = await params

    const res = await fetch(`${BACKEND_URL}/api/dev-menu/${featureId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    if (!res.ok) {
      console.warn(`[BFF /api/dev-menu/${featureId}] Backend returned`, res.status)
      return NextResponse.json({ ok: false, status: res.status }, { status: res.status })
    }

    const data = await res.json().catch(() => ({ ok: true }))
    return NextResponse.json(data)
  } catch (err) {
    console.error(`[BFF /api/dev-menu/[featureId]] PUT error:`, err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
