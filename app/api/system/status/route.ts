import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "")

export async function GET() {
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`

    const res = await fetch(`${BACKEND_URL}/api/system/status`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }).catch(() => null)

    if (!res || !res.ok) {
      return Response.json({ backend: "offline", database: "offline" }, { status: 503 })
    }

    return Response.json(await res.json())
  } catch {
    return Response.json({ backend: "offline", database: "offline" }, { status: 503 })
  }
}
