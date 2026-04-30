import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { DashboardAdmin } from "@/components/dashboard/dashboard-admin"
import { DashboardColaborador } from "@/components/dashboard/dashboard-colaborador"
import { getFaturamentoMes, getResumoFinanceiroHoje } from "@/lib/backend-financeiro"
import { backendFetch, extractTasksPayload, getSessionAccessToken } from "@/lib/backend-api"
import {
  isTaskDueToday,
  sortTarefasByPriority,
} from "@/lib/tarefas"

function getMonthBounds() {
  const now = new Date()
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  }
}

export default async function DashboardPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  const accessToken = getSessionAccessToken(session)
  if (!accessToken) {
    redirect("/login")
  }

  console.log("[Dashboard Auth Debug]", {
    hasSession: !!session,
    hasUser: !!session?.user,
    hasAccessToken: !!accessToken,
    tokenLength: accessToken?.length,
    tokenPrefix: accessToken?.substring(0, 50),
    userRole: session?.user?.role,
  })

  const role = session.user.role
  const isColaborador = role === "COLABORADOR"

  const { response, data } = await backendFetch("/api/tasks", {
    token: accessToken,
  })

  if (!response.ok) {
    const errorMsg = data && typeof data === "object" && "message" in data
      ? (data as { message?: string }).message
      : "Desconhecido"
    console.error(`[Dashboard] Falha ao carregar tarefas: ${response.status} - ${errorMsg}`)
    throw new Error(`Falha ao carregar tarefas do dashboard. Status: ${response.status}. ${errorMsg !== "Desconhecido" ? `Detalhes: ${errorMsg}` : ""}`)
  }

  const { tasks } = extractTasksPayload(data)
  const tarefas = isColaborador
    ? tasks.filter((tarefa) => tarefa.assigneeId === session.user.id)
    : tasks

  const tarefasPendentes = sortTarefasByPriority(
    tarefas.filter(
      (tarefa) => tarefa.status === "PENDENTE" || tarefa.status === "EM_ANDAMENTO"
    )
  )

  const tarefasHoje = sortTarefasByPriority(
    tarefas.filter(
      (tarefa) =>
        (tarefa.status === "PENDENTE" || tarefa.status === "EM_ANDAMENTO") &&
        isTaskDueToday(tarefa.dueAt)
    )
  ).slice(0, 5)

  if (!isColaborador) {
    const [faturamentoMes, resumoHoje] = await Promise.all([
      getFaturamentoMes().catch(() => undefined),
      getResumoFinanceiroHoje().catch(() => undefined),
    ])

    return (
      <DashboardAdmin
        tarefasHoje={tarefasHoje}
        tarefasPendentes={tarefasPendentes}
        faturamentoMes={faturamentoMes}
        resumoHoje={resumoHoje}
        currentUser={{ id: session.user.id }}
      />
    )
  }

  const { start, end } = getMonthBounds()
  const concluidasMes = tarefas.filter((tarefa) => {
    if (tarefa.status !== "CONCLUIDA" || !tarefa.completedAt) {
      return false
    }

    const completedAt = new Date(tarefa.completedAt)
    return completedAt >= start && completedAt < end
  }).length

  const pendentes = tarefas.filter(
    (tarefa) => tarefa.status === "PENDENTE" || tarefa.status === "EM_ANDAMENTO"
  ).length
  const totalBase = concluidasMes + pendentes
  const taxaConclusao = totalBase === 0 ? 0 : Math.round((concluidasMes / totalBase) * 100)

  return (
    <DashboardColaborador
      userId={session.user.id}
      userName={session.user.name ?? "Colaborador"}
      tarefasHoje={tarefasHoje}
      tarefasPendentes={tarefasPendentes}
      concluidasMes={concluidasMes}
      pendentes={pendentes}
      taxaConclusao={taxaConclusao}
    />
  )
}
