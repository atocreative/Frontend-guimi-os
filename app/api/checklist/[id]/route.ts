import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth-session"
import { backendFetch, extractChecklistItemPayload, getSessionAccessToken } from "@/lib/backend-api"
import { z } from "zod"

const toggleSchema = z.object({
  completed: z.boolean(),
})

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
  const parsed = toggleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { id } = await ctx.params
  const result = await backendFetch(`/api/checklists/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(parsed.data),
  })

  if (!result.response.ok) {
    return Response.json(
      { error: result.data?.message || result.data?.error || "Erro ao atualizar checklist." },
      { status: result.response.status }
    )
  }

  return Response.json({ item: extractChecklistItemPayload(result.data) })
}
