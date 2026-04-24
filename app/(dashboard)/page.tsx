import { getSession } from "@/lib/auth-session"
import { DashboardAdmin } from "@/components/dashboard/dashboard-admin"
import { DashboardColaborador } from "@/components/dashboard/dashboard-colaborador"
import { prisma } from "@/lib/prisma"
import { getFaturamentoMes, getResumoFinanceiroHoje } from "@/lib/foneninja"
import {
  isTaskDueToday,
  serializeTarefa,
  sortTarefasByPriority,
} from "@/lib/tarefas"
import type { TarefaDB } from "@/types/tarefas"

function getMonthBounds() {
  const now = new Date()
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  }
}

export default async function DashboardPage() {
  const session = await getSession()
  const role = session?.user?.role
  const userId = session?.user?.id
  const isColaborador = role === "COLABORADOR"

  const tarefasRaw = await prisma.task.findMany({
    where: {
      ...(isColaborador && userId ? { assigneeId: userId } : {}),
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
          jobTitle: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const tarefas: TarefaDB[] = tarefasRaw.map((tarefa) =>
    serializeTarefa({
      ...tarefa,
      status: tarefa.status as TarefaDB["status"],
      priority: (tarefa.priority as TarefaDB["priority"]) ?? null,
      assignee: tarefa.assignee
        ? {
            ...tarefa.assignee,
            role: String(tarefa.assignee.role),
            jobTitle: tarefa.assignee.jobTitle,
          }
        : null,
    })
  )

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
      />
    )
  }

  const { start, end } = getMonthBounds()
  const concluidasMes = await prisma.task.count({
    where: {
      ...(userId ? { assigneeId: userId } : {}),
      status: "CONCLUIDA",
      completedAt: { gte: start, lt: end },
    },
  })
  const pendentes = tarefas.filter(
    (tarefa) => tarefa.status === "PENDENTE" || tarefa.status === "EM_ANDAMENTO"
  ).length
  const totalBase = concluidasMes + pendentes
  const taxaConclusao = totalBase === 0 ? 0 : Math.round((concluidasMes / totalBase) * 100)

  return (
    <DashboardColaborador
      userName={session?.user?.name ?? "Colaborador"}
      tarefasHoje={tarefasHoje}
      tarefasPendentes={tarefasPendentes}
      concluidasMes={concluidasMes}
      pendentes={pendentes}
      taxaConclusao={taxaConclusao}
    />
  )
}
