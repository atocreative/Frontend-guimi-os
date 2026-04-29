"use client"

import { useCallback, useMemo, useState } from "react"
import { CheckCircle2, ListTodo, Percent, Sunrise } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { PainelCompromissos } from "@/components/dashboard/painel-compromissos"
import { PainelTarefas } from "@/components/dashboard/painel-tarefas"
import { Leaderboard } from "@/components/gamificacao/leaderboard"
import { UserStats } from "@/components/gamificacao/user-stats"
import { useGamificacaoFeedback } from "@/hooks/use-gamificacao-feedback"
import type { TarefaDB } from "@/types/tarefas"

interface DashboardColaboradorProps {
  userId: string
  userName: string
  tarefasHoje: TarefaDB[]
  tarefasPendentes: TarefaDB[]
  concluidasMes: number
  pendentes: number
  taxaConclusao: number
}

export function DashboardColaborador({
  userId,
  userName,
  tarefasHoje,
  tarefasPendentes,
  concluidasMes,
  pendentes,
  taxaConclusao,
}: DashboardColaboradorProps) {
  const dataAtual = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date())

  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())
  const { notifyTaskCompleted, notifyTaskCompletionError } = useGamificacaoFeedback()

  const concluirTarefa = useCallback(async (id: string) => {
    const tarefa = [...tarefasHoje, ...tarefasPendentes].find((item) => item.id === id)

    const res = await fetch(`/api/tarefas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONCLUIDA" }),
    })

    if (res.ok) {
      notifyTaskCompleted({ taskTitle: tarefa?.title })
      setRiscados((prev) => new Set(prev).add(id))
      setTimeout(() => {
        setConcluidos((prev) => new Set(prev).add(id))
        setRiscados((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 700)
    } else {
      notifyTaskCompletionError()
    }

    return res.ok
  }, [notifyTaskCompleted, notifyTaskCompletionError, tarefasHoje, tarefasPendentes])

  const pendentesVisiveis = useMemo(
    () => tarefasPendentes.filter((t) => !concluidos.has(t.id)),
    [tarefasPendentes, concluidos]
  )
  const hojeVisiveis = useMemo(
    () => tarefasHoje.filter((t) => !concluidos.has(t.id)),
    [tarefasHoje, concluidos]
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Visão individual de produtividade
        </p>
      </div>

      <Card className="overflow-hidden border-zinc-200 bg-gradient-to-r from-zinc-950 to-zinc-800 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-zinc-300">
            <Sunrise className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.2em]">Boas-vindas</span>
          </div>
          <CardTitle className="text-2xl">Olá, {userName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-300">
            {dataAtual.charAt(0).toUpperCase() + dataAtual.slice(1)}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard
          titulo="Concluídas no Mês"
          valor={`${concluidasMes}`}
          descricao="tarefas finalizadas"
          icone={CheckCircle2}
          tendencia="up"
        />
        <KpiCard
          titulo="Pendentes"
          valor={`${pendentes}`}
          descricao="em aberto"
          icone={ListTodo}
          tendencia={pendentes > 0 ? "neutral" : "up"}
        />
        <KpiCard
          titulo="Taxa de Conclusão"
          valor={`${taxaConclusao}%`}
          descricao="base individual"
          icone={Percent}
          tendencia={taxaConclusao >= 70 ? "up" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <UserStats userId={userId} />
        <PainelCompromissos tarefas={hojeVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
        <PainelTarefas
          tarefas={pendentesVisiveis}
          onConcluir={concluirTarefa}
          riscados={riscados}
          title="Suas tarefas pendentes"
          emptyMessage="Nenhuma tarefa pendente."
        />
      </div>

      <Leaderboard currentUserId={userId} compact />
    </div>
  )
}
