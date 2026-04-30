import { getSession } from "@/lib/auth-session"
import {
  backendFetch,
  extractUserPayload,
  getSessionAccessToken,
} from "@/lib/backend-api"

function toErrorResponse(status: number, data: unknown) {
  const payload = data && typeof data === "object" ? data as { message?: string; error?: string } : null

  return Response.json(
    {
      error:
        payload?.message || payload?.error || "Não foi possível processar a solicitação.",
    },
    { status }
  )
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_USER") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { id } = params

  const result = await backendFetch(`/api/users/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  })

  if (!result.response.ok) {
    return toErrorResponse(result.response.status, result.data)
  }

  return Response.json({ usuario: extractUserPayload(result.data) })
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_USER") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = params

  const result = await backendFetch(`/api/users/${id}`, {
    method: "DELETE",
    token,
  })

  if (!result.response.ok) {
    return toErrorResponse(result.response.status, result.data)
  }

  return Response.json({ success: true })
}
