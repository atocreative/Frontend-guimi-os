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
  let startDate = searchParams.get("startDate")
  let endDate = searchParams.get("endDate")

  // Support year/month/day params from dashboard-summary service
  if (!startDate || !endDate) {
    const yearParam = searchParams.get("year")
    const monthParam = searchParams.get("month")
    const dayParam = searchParams.get("day")
    if (yearParam && monthParam !== null) {
      const year = parseInt(yearParam, 10)
      const month = parseInt(monthParam, 10) // 0-indexed
      if (dayParam) {
        const day = parseInt(dayParam, 10)
        startDate = new Date(Date.UTC(year, month, day)).toISOString()
        endDate = new Date(Date.UTC(year, month, day + 1) - 1).toISOString()
      } else {
        startDate = new Date(Date.UTC(year, month, 1)).toISOString()
        endDate = new Date(Date.UTC(year, month + 1, 1) - 1).toISOString()
      }
    }
  }

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
