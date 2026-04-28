import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth-session"
import {
  backendFetch,
  extractTaskPayload,
  extractTasksPayload,
  extractUsersPayload,
  getSessionAccessToken,
} from "@/lib/backend-api"
import { taskCreateSchema, taskFiltersSchema } from "@/lib/schemas"

function toErrorResponse(status: number, data: unknown) {
  return Response.json(
    {
      error:
        data?.message || data?.error || "Não foi possível processar a solicitação.",
    },
    { status }
  )
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const query = {
    assigneeId: req.nextUrl.searchParams.get("assigneeId") ?? undefined,
    status: req.nextUrl.searchParams.get("status") ?? undefined,
    orderBy: req.nextUrl.searchParams.get("orderBy") ?? undefined,
    sort: req.nextUrl.searchParams.get("sort") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  }

  const parsedFilters = taskFiltersSchema.safeParse(query)
  if (!parsedFilters.success) {
    return Response.json({ error: parsedFilters.error.flatten() }, { status: 400 })
  }

  const [tasksResult, usersResult] = await Promise.all([
    backendFetch("/api/tasks", {
      token,
      params: parsedFilters.data,
    }),
    backendFetch("/api/users", { token }),
  ])

  if (!tasksResult.response.ok) {
    return toErrorResponse(tasksResult.response.status, tasksResult.data)
  }

  if (!usersResult.response.ok) {
    return toErrorResponse(usersResult.response.status, usersResult.data)
  }

  const { tasks } = extractTasksPayload(tasksResult.data)
  const { users } = extractUsersPayload(usersResult.data)

  return Response.json({
    tarefas: tasks,
    usuarios: users.map((user) => ({
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      jobTitle: user.jobTitle,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = taskCreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const payload = {
    ...parsed.data,
    assigneeId:
      session.user.role === "COLABORADOR"
        ? session.user.id
        : parsed.data.assigneeId ?? session.user.id,
  }

  const result = await backendFetch("/api/tasks", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })

  if (!result.response.ok) {
    return toErrorResponse(result.response.status, result.data)
  }

  return Response.json({ tarefa: extractTaskPayload(result.data) }, { status: 201 })
}
