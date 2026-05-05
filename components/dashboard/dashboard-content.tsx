"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardAdmin } from "@/components/dashboard/dashboard-admin"
import { DashboardColaborador } from "@/components/dashboard/dashboard-colaborador"
import { ApiError } from "@/lib/repositories/backend-repository"
import { backendService } from "@/lib/services/backend-service"
import { sortTarefasByPriority } from "@/lib/task-utils"
import type { TarefaDB } from "@/types/tarefas"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardContentProps {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    role: string
  } | null
}

function isTaskDueToday(value: string | null | Date): boolean {
  if (!value) return false
  return new Date(value).toDateString() === new Date().toDateString()
}

function getMensagemErro(error: unknown, recurso: string) {
  if (error instanceof ApiError) {
    if (error.code === "FRONTEND_SESSION_MISSING") {
      return `Sua sessão expirou no frontend. Faça login novamente para carregar ${recurso}.`
    }

    if (error.code === "BACKEND_TOKEN_REJECTED") {
      return `O backend rejeitou o token atual ao carregar ${recurso}. Faça login novamente para renovar a autenticação.`
    }

    if (error.status === 403) {
      return `Seu usuário não tem permissão para carregar ${recurso}.`
    }
  }

  return `Não foi possível carregar ${recurso}.`
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [tarefas, setTarefas] = useState<TarefaDB[]>([])
  const [loading, setLoading] = useState(true)
  const [tarefasErro, setTarefasErro] = useState<string | null>(null)

  const isColaborador = user?.role === "COLABORADOR"

  useEffect(() => {
    async function carregarDados() {
      try {
        setTarefasErro(null)

        try {
          const tarefasData = await backendService.getTasks()
          setTarefas(tarefasData.tasks || [])
        } catch (error) {
          setTarefas([])
          setTarefasErro(getMensagemErro(error, "suas tarefas"))
          console.error("Erro ao carregar tarefas:", error)
        }

        if (!isColaborador) {
          // KPIs financeiros são carregados diretamente pelo DashboardAdmin via /api/indicadores/geral
        }
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [isColaborador])

  const tarefasPendentes = useMemo(
    () =>
      sortTarefasByPriority(
        tarefas.filter(
          (tarefa) => tarefa.status === "PENDENTE" || tarefa.status === "EM_ANDAMENTO"
        )
      ),
    [tarefas]
  )

  const tarefasHoje = useMemo(
    () =>
      sortTarefasByPriority(
        tarefas.filter(
          (tarefa) =>
            (tarefa.status === "PENDENTE" || tarefa.status === "EM_ANDAMENTO") &&
            isTaskDueToday(tarefa.dueAt)
        )
      ).slice(0, 5),
    [tarefas]
  )

  const avisos = [tarefasErro].filter(Boolean) as string[]
  const alerta = avisos.length > 0 ? (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <ul className="space-y-1">
        {avisos.map((aviso) => (
          <li key={aviso}>{aviso}</li>
        ))}
      </ul>
    </div>
  ) : null

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  if (isColaborador) {
    const concluidasMes = tarefas.filter((t) => t.status === "CONCLUIDA").length
    const pendentes = tarefas.filter((t) => t.status === "PENDENTE" || t.status === "EM_ANDAMENTO").length
    const total = concluidasMes + pendentes
    const taxaConclusao = total > 0 ? Math.round((concluidasMes / total) * 100) : 0

    return (
      <div className="space-y-6">
        {alerta}
        <DashboardColaborador
          userId={user?.id ?? ""}
          userName={user?.name ?? ""}
          tarefasHoje={tarefasHoje}
          tarefasPendentes={tarefasPendentes}
          concluidasMes={concluidasMes}
          pendentes={pendentes}
          taxaConclusao={taxaConclusao}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {alerta}
      <DashboardAdmin
        tarefasHoje={tarefasHoje}
        tarefasPendentes={tarefasPendentes}
      />
    </div>
  )
}
