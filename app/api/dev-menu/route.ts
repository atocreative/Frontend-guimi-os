import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"
import { normalizeDevMenuItems } from "@/lib/feature-definitions"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function GET() {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!token) {
    // Sem token = não autenticado; retorna defaults para não quebrar a UI de login
    return NextResponse.json(normalizeDevMenuItems([]), { status: 200 })
  }

  const res = await fetch(`${BACKEND_URL}/api/dev-menu`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (!res.ok) {
    console.error(`[BFF /api/dev-menu] Backend returned ${res.status}`)
    return NextResponse.json(
      { error: "DEV_MENU_FETCH_FAILED", status: res.status },
      { status: 502 }
    )
  }

  const data = await res.json()
  const raw = Array.isArray(data) ? data : (data.data || data.menu || [])
  return NextResponse.json(normalizeDevMenuItems(raw))
}
