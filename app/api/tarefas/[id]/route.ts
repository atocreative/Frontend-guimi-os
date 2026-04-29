import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth-session"
import { backendFetch, extractTaskPayload, getSessionAccessToken } from "@/lib/backend-api"
import { taskUpdateSchema } from "@/lib/schemas"

function toErrorResponse(status: number, data: unknown) {
  const payload = data && typeof data === "object" ? data as { message?: string; error?: string } : null
  const message =
    status === 404 || status === 403
      ? "Recurso não encontrado ou você não tem permissão para acessá-lo."
      : payload?.message || payload?.error || "Não foi possível processar a solicitação."

  return Response.json({ error: message }, { status })
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params
  const result = await backendFetch(`/api/tasks/${id}`, { token })

  if (!result.response.ok) {
    return toErrorResponse(result.response.status, result.data)
  }

  return Response.json({ tarefa: extractTaskPayload(result.data) })
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = taskUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const payload = { ...parsed.data }
  if (session.user.role === "COLABORADOR") {
    delete payload.assigneeId
  }

  const { id } = await ctx.params
  const result = await backendFetch(`/api/tasks/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })

  if (!result.response.ok) {
    return toErrorResponse(result.response.status, result.data)
  }

  return Response.json({ tarefa: extractTaskPayload(result.data) })
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params
  const result = await backendFetch(`/api/tasks/${id}`, {
    method: "DELETE",
    token,
  })

  if (!result.response.ok) {
    return toErrorResponse(result.response.status, result.data)
  }

  return new Response(null, { status: 204 })
}
