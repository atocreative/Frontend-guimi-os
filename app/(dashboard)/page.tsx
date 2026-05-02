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

export const dynamic = "force-dynamic"

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

    console.log("[Dashboard] Iniciando carregamento de dados financeiros:", { month, year })

    const [snapshot, dashboardData] = await Promise.all([
      getSnapshotFinanceiroServer(month, year, accessToken).catch((err) => {
        console.error("[Dashboard] Erro ao carregar snapshot:", err)
        return null
      }),
      getDashboardDataServer(accessToken).catch((err) => {
        console.error("[Dashboard] Erro ao carregar dashboard data:", err)
        return undefined
      }),
    ])

    const financeiroData = dashboardData?.financeiro

    console.log("[Dashboard] Raw dashboardData (completo):", JSON.stringify(dashboardData, null, 2))
    console.log("[Dashboard] Raw snapshot (completo):", JSON.stringify(snapshot, null, 2))
    console.log("[Dashboard] Dados extraídos financeiroData:", financeiroData)

    // Mapeamento com fallbacks - tenta múltiplos nomes de campo
    const faturamentoMes =
      snapshot?.receita ??
      snapshot?.totalReceitas ??
      snapshot?.faturamento ??
      dashboardData?.receita ??
      dashboardData?.totalReceitas ??
      financeiroData?.receita ??
      0

    const despesasVariaveis =
      snapshot?.despesasVariaveis ??
      snapshot?.variableExpenses ??
      snapshot?.despesas_variaveis ??
      dashboardData?.despesasVariaveis ??
      financeiroData?.despesasVariaveis ??
      0

    const despesasFixas =
      snapshot?.fixedExpensesTotal ??
      snapshot?.fixedExpenses ??
      snapshot?.despesasFixas ??
      snapshot?.despesas_fixas ??
      dashboardData?.despesasFixas ??
      financeiroData?.despesasFixas ??
      0

    const despesasMes = despesasFixas + despesasVariaveis

    const lucroLiquidoMes =
      snapshot?.netProfit ??
      snapshot?.lucroLiquido ??
      snapshot?.lucro_liquido ??
      dashboardData?.netProfit ??
      dashboardData?.lucroLiquido ??
      financeiroData?.netProfit ??
      financeiroData?.lucroLiquido ??
      0

    const resumoHoje = {
      faturamentoDia:
        snapshot?.todayRevenue ??
        snapshot?.receita_hoje ??
        snapshot?.receitaHoje ??
        dashboardData?.receitaHoje ??
        financeiroData?.receitaHoje ??
        0,
      lucroBrutoDia:
        snapshot?.todayProfit ??
        snapshot?.lucro_bruto_hoje ??
        snapshot?.lucroBrutoHoje ??
        dashboardData?.lucroBrutoHoje ??
        financeiroData?.lucroBrutoHoje ??
        0,
      margemBrutaDia:
        snapshot?.todayMargin ??
        snapshot?.margem_bruta_hoje ??
        snapshot?.margemBrutaHoje ??
        dashboardData?.margemBrutaHoje ??
        financeiroData?.margemBrutaHoje ??
        0,
    }

    console.log("[Dashboard] Mapeamento de valores (antes de fallbacks):", {
      "snapshot.receita": snapshot?.receita,
      "snapshot.totalReceitas": snapshot?.totalReceitas,
      "snapshot.faturamento": snapshot?.faturamento,
      "dashboardData.receita": dashboardData?.receita,
      "financeiroData.receita": financeiroData?.receita,
    })

    console.log("[Dashboard] Valores finais mapeados:", {
      faturamentoMes,
      despesasFixas,
      despesasVariaveis,
      despesasMes,
      lucroLiquidoMes,
      resumoHoje,
    })

    // Validação: alertar se valores estão todos zeros
    const todosZeros =
      faturamentoMes === 0 &&
      despesasFixas === 0 &&
      despesasVariaveis === 0 &&
      lucroLiquidoMes === 0

    if (todosZeros) {
      console.warn("[Dashboard] ⚠️ TODOS OS VALORES FINANCEIROS ESTÃO ZERO - VERIFICAR BACKEND")
      console.warn("[Dashboard] Verifique os endpoints:", {
        "/api/financeiro/snapshot": "deveria retornar dados financeiros",
        "/api/dashboard": "deveria retornar dados agregados",
        "Campos esperados no backend": ["receita", "totalReceitas", "despesasFixas", "despesasVariaveis", "netProfit", "lucroLiquido"]
      })
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
        mes={month}
        ano={year}
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
