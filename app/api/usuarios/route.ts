import { getSession } from "@/lib/auth-session"
import {
  backendFetch,
  extractUserPayload,
  extractUsersPayload,
  getSessionAccessToken,
} from "@/lib/backend-api"
import { userCreateSchema } from "@/lib/schemas"

function toErrorResponse(status: number, data: unknown) {
  return Response.json(
    {
      error:
        data?.message || data?.error || "Não foi possível processar a solicitação.",
    },
    { status }
  )
}

export async function GET() {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await backendFetch("/api/users", { token })

  if (!result.response.ok) {
    return toErrorResponse(result.response.status, result.data)
  }

  const { users } = extractUsersPayload(result.data)
  return Response.json({ usuarios: users })
}

export async function POST(req: Request) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = userCreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const payload = {
    ...parsed.data,
    email: parsed.data.email.toLowerCase(),
  }

  const result = await backendFetch("/api/users", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })

  if (!result.response.ok) {
    return toErrorResponse(result.response.status, result.data)
  }

  return Response.json({ usuario: extractUserPayload(result.data) }, { status: 201 })
}
