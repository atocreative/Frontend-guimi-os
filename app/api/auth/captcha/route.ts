import { NextResponse } from "next/server"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/captcha`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "CAPTCHA_UNAVAILABLE" }, { status: 502 })
  }
}
