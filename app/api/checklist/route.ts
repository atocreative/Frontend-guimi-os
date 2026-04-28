import { getSession } from "@/lib/auth-session"
import { backendFetch, extractChecklistsPayload, getSessionAccessToken } from "@/lib/backend-api"

function mapChecklistItems(items: Array<{ id: string; title: string; description?: string | null; completed: boolean }>) {
  return items.map((item) => ({
    id: item.id,
    titulo: item.title,
    descricao: item.description ?? null,
    concluido: item.completed,
    responsavel: "Equipe",
    horario: null,
  }))
}

export async function GET() {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await backendFetch("/api/checklists", { token })

  if (!result.response.ok) {
    return Response.json(
      { error: result.data?.message || result.data?.error || "Erro ao carregar checklists." },
      { status: result.response.status }
    )
  }

  const checklists = extractChecklistsPayload(result.data)
  const abertura = checklists
    .filter((checklist) => checklist.tipo === "ABERTURA")
    .flatMap((checklist) => mapChecklistItems(checklist.items))
  const fechamento = checklists
    .filter((checklist) => checklist.tipo === "FECHAMENTO")
    .flatMap((checklist) => mapChecklistItems(checklist.items))

  return Response.json({ abertura, fechamento })
}
