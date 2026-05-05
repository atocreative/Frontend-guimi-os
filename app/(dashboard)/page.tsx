import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { DashboardAdmin } from "@/components/dashboard/dashboard-admin"
import { DashboardColaborador } from "@/components/dashboard/dashboard-colaborador"
import { getFinanceiroSummaryServer } from "@/lib/backend-financeiro"
import { backendFetch, extractTasksPayload, getSessionAccessToken } from "@/lib/backend-api"
import {
  isTaskDueToday,
  sortTarefasByPriority,
} from "@/lib/tarefas"
import { getMonthRange } from "@/lib/financeiro-utils"

export const dynamic = "force-dynamic"


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
  }).catch((err) => {
    console.error("[Dashboard] Error fetching tasks:", err)
    return { response: { ok: false, status: 503 }, data: null }
  })

  if (!response.ok) {
    const errorMsg = data && typeof data === "object" && "message" in data
      ? (data as { message?: string }).message
      : "Desconhecido"
    console.error(`[Dashboard] Falha ao carregar tarefas: ${response.status} - ${errorMsg}`)
    // Don't throw - return empty tasks and continue
  }

  // If fetch failed, use empty tasks but don't crash
  const taskData = response.ok ? extractTasksPayload(data) : { tasks: [], total: 0 }
  const { tasks } = taskData
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
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // Fonte canônica: vendas filtradas pelo mês via getFinanceiroSummaryServer
    // SE não houver dados no período → erro explícito, não zero silencioso
    let summary: Awaited<ReturnType<typeof getFinanceiroSummaryServer>> = null
    let summaryError: string | null = null

    try {
      summary = await getFinanceiroSummaryServer(accessToken)
    } catch (err) {
      summaryError = err instanceof Error ? err.message : String(err)
      console.error("[Dashboard] ⚠️ Erro ao carregar summary financeiro:", summaryError)
    }

    if (!summary && !summaryError) {
      console.warn("[Dashboard] ⚠️ /api/financeiro/sales não retornou dados — backend sem vendas no período ou endpoint ausente")
    }

    // Backend retorna { data, count, resumo, grafico, periodo }
    const faturamentoMes = summary?.resumo?.faturamentoMes ?? undefined
    const despesasMes = summary?.resumo?.despesasMes ?? undefined
    const lucroLiquidoMes = summary?.resumo?.lucroLiquidoMes ?? undefined
    const metaMes = undefined
    const percentualMeta = undefined
    const resumoHoje = undefined

    console.log("[Dashboard] Financeiro:", {
      fonte: summary ? "sales" : "indisponível",
      erro: summaryError,
      faturamentoMes,
      despesasMes,
      lucroLiquidoMes,
      periodo: summary?.periodo,
    })

    return (
      <DashboardAdmin
        tarefasHoje={tarefasHoje}
        tarefasPendentes={tarefasPendentes}
        faturamentoMes={faturamentoMes}
        resumoHoje={resumoHoje}
        despesasMes={despesasMes}
        lucroLiquidoMes={lucroLiquidoMes}
        metaMes={metaMes}
        percentualMeta={percentualMeta}
        currentUser={{ id: session.user.id }}
        mes={month}
        ano={year}
      />
    )
  }

  const { startDate, endDate } = getMonthRange()
  const start = new Date(startDate)
  const end = new Date(endDate)

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
