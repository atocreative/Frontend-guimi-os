import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { DashboardAdmin } from "@/components/dashboard/dashboard-admin"
import { DashboardColaborador } from "@/components/dashboard/dashboard-colaborador"
import { getSnapshotFinanceiroServer, getDashboardDataServer } from "@/lib/backend-financeiro"
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
    // Usar funções server-side que usam backendFetch
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const [dashboardData] = await Promise.all([
      getDashboardDataServer(accessToken).catch(() => undefined),
    ])

    // Extrair dados de despesas e lucro líquido do dashboard aggregado
    const faturamentoMes = dashboardData?.receita || dashboardData?.totalReceitas || 0
    const despesasMes = dashboardData?.despesasVariaveis || dashboardData?.expenses || 0
    const lucroLiquidoMes = dashboardData?.netProfit || dashboardData?.lucroLiquido || 0
    const lucroBrutoDia = dashboardData?.grossProfit || 0
    const margemBrutaDia = dashboardData?.grossMargin || 0

    const resumoHoje = {
      faturamentoDia: faturamentoMes / 30, // Aproximado
      lucroBrutoDia,
      margemBrutaDia,
    }

    return (
      <DashboardAdmin
        tarefasHoje={tarefasHoje}
        tarefasPendentes={tarefasPendentes}
        faturamentoMes={faturamentoMes}
        resumoHoje={resumoHoje}
        despesasMes={despesasMes}
        lucroLiquidoMes={lucroLiquidoMes}
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
