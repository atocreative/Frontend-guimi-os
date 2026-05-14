import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined in environment")
  }
  return url.replace(/\/$/, "")
})()

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const params = new URLSearchParams()
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)

  const reqHeaders: Record<string, string> = {}
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)
    if (token) reqHeaders["Authorization"] = `Bearer ${token}`
  } catch {
    // proceed without auth
  }

  const res = await fetch(`${BACKEND_URL}/api/dashboard?${params.toString()}`, {
    headers: reqHeaders,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)

  if (!res || !res.ok) {
    return NextResponse.json(
      {
        error: "DASHBOARD_SUMMARY_FAILED",
        message: `Backend returned ${res?.status ?? "no response"}`,
        status: 502,
      },
      { status: 502 }
    )
  }

  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "DASHBOARD_SUMMARY_FAILED", message: "Backend returned non-JSON", status: 502 },
      { status: 502 }
    )
  }

  const data = await res.json().catch(() => null)
  if (!data) {
    return NextResponse.json(
      { error: "DASHBOARD_SUMMARY_FAILED", message: "Failed to parse backend response", status: 502 },
      { status: 502 }
    )
  }

  return NextResponse.json(data)
}
