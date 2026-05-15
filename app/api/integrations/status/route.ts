import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "")

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`

    const res = await fetch(`${BACKEND_URL}/api/integrations/status`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    }).catch(() => null)

    if (!res || !res.ok) {
      return Response.json({ foneninja: "offline", kommo: "unknown", meuAssessor: "unknown" })
    }

    const raw = await res.json().catch(() => null)
    if (!raw) return Response.json({ foneninja: "offline", kommo: "unknown", meuAssessor: "unknown" })

    // Normalize backend response { foneninja: "offline"|"online" }
    return Response.json({
      foneninja: raw.foneninja ?? "unknown",
      kommo: raw.kommo ?? "unknown",
      meuAssessor: raw.meuAssessor ?? raw.meu_assessor ?? "unknown",
      _raw: raw,
    })
  } catch (error) {
    console.error("[integrations/status] Error:", error)
    return Response.json({ foneninja: "offline", kommo: "unknown", meuAssessor: "unknown" })
  }
}
