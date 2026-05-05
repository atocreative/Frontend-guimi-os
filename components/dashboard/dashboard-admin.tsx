"use client"

import { memo, useCallback, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  PiggyBank,
  Receipt,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { PainelCompromissos } from "@/components/dashboard/painel-compromissos"
import { PainelTarefas } from "@/components/dashboard/painel-tarefas"
import { Leaderboard } from "@/components/gamificacao/leaderboard"
import { useGamificacaoFeedback } from "@/hooks/use-gamificacao-feedback"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { backendService } from "@/lib/services/backend-service"
import type { TarefaDB } from "@/types/tarefas"

export interface ResumoFinanceiroHoje {
  faturamentoDia: number
  lucroBrutoDia: number
  margemBrutaDia: number
}

interface DashboardAdminUser {
  id: string
}

const GraficoFinanceiro = dynamic(
  () => import("@/components/dashboard/grafico-financeiro").then((m) => m.GraficoFinanceiro),
  {
    ssr: false,
    loading: () => (
      <Card><CardContent className="p-6"><Skeleton className="h-[240px] rounded-lg" /></CardContent></Card>
    ),
  }
)

const formatBRL = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)

interface KpiGridProps {
  faturamentoDiaValor: string
  faturamentoDiaDescricao: string
  faturamentoMes?: number
  lucroBrutoValor: string
  lucroBrutoDescricao: string
  lucroLiquidoMes?: number
  metaMes?: number
  percentualMeta?: number
}

const KpiGridPrimeira = memo(function KpiGridPrimeira({
  faturamentoDiaValor,
  faturamentoDiaDescricao,
  faturamentoMes,
  lucroBrutoValor,
  lucroBrutoDescricao,
  lucroLiquidoMes,
  metaMes,
  percentualMeta,
}: KpiGridProps) {
  const metaDescricao = metaMes && metaMes > 0 && percentualMeta !== undefined
    ? `${percentualMeta.toFixed(1)}% da meta (${formatBRL(metaMes)})`
    : faturamentoMes !== undefined ? "Meta não configurada" : "Aguardando dados"

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <KpiCard
        titulo="Faturamento do Dia"
        valor={faturamentoDiaValor}
        descricao={faturamentoDiaDescricao}
        icone={DollarSign}
        tendencia="up"
      />
      <KpiCard
        titulo="Faturamento do Mês"
        valor={faturamentoMes !== undefined ? formatBRL(faturamentoMes) : "—"}
        descricao={metaDescricao}
        icone={Target}
        tendencia="up"
      />
      <KpiCard
        titulo="Lucro Bruto"
        valor={lucroBrutoValor}
        descricao={lucroBrutoDescricao}
        icone={PiggyBank}
      />
      <KpiCard
        titulo="Lucro Líquido"
        valor={lucroLiquidoMes !== undefined ? formatBRL(lucroLiquidoMes) : "—"}
        descricao={lucroLiquidoMes !== undefined ? "Resultado do mês" : "Aguardando dados"}
        icone={TrendingUp}
        tendencia="up"
        destaque
      />
    </div>
  )
})

interface KpiGridSegundaProps {
  despesasMes?: number
}

const KpiGridSegunda = memo(function KpiGridSegunda({ despesasMes }: KpiGridSegundaProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <KpiCard titulo="A Pagar" valor="—" descricao="Não disponível na API" icone={ArrowDownLeft} tendencia="down" />
      <KpiCard titulo="A Receber" valor="—" descricao="Não disponível na API" icone={ArrowUpRight} tendencia="up" />
      <KpiCard
        titulo="Total Despesas"
        valor={despesasMes !== undefined ? formatBRL(despesasMes) : "—"}
        descricao={despesasMes !== undefined ? "Este mês (real)" : "Aguardando dados"}
        icone={Receipt}
        tendencia="down"
      />
      <KpiCard titulo="Saldo em Caixa" valor="—" descricao="Não disponível na API" icone={Wallet} tendencia="neutral" destaque />
    </div>
  )
})

interface DashboardAdminProps {
  tarefasHoje: TarefaDB[]
  tarefasPendentes: TarefaDB[]
  faturamentoMes?: number
  resumoHoje?: ResumoFinanceiroHoje
  despesasMes?: number
  lucroLiquidoMes?: number
  metaMes?: number
  percentualMeta?: number
  currentUser?: DashboardAdminUser
  mes?: number
  ano?: number
}

export function DashboardAdmin({
  tarefasHoje,
  tarefasPendentes,
  faturamentoMes,
  resumoHoje,
  despesasMes,
  lucroLiquidoMes,
  metaMes,
  percentualMeta,
  currentUser,
}: DashboardAdminProps) {
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())
  const { notifyTaskCompleted, notifyTaskCompletionError } = useGamificacaoFeedback()

  const tarefasPorId = useMemo(
    () => new Map([...tarefasHoje, ...tarefasPendentes].map((tarefa) => [tarefa.id, tarefa])),
    [tarefasHoje, tarefasPendentes]
  )

  const faturamentoDiaValor = useMemo(
    () => resumoHoje ? formatBRL(resumoHoje.faturamentoDia) : "—",
    [resumoHoje]
  )
  const faturamentoDiaDescricao = resumoHoje ? "Hoje (real)" : "Aguardando dados"
  const lucroBrutoValor = useMemo(
    () => resumoHoje ? formatBRL(resumoHoje.lucroBrutoDia) : "—",
    [resumoHoje]
  )
  const lucroBrutoDescricao = useMemo(
    () => resumoHoje ? `Margem bruta ${(resumoHoje.margemBrutaDia ?? 0).toFixed(2)}%` : "Aguardando dados",
    [resumoHoje]
  )

  const concluirTarefa = useCallback(async (id: string) => {
    const tarefa = tarefasPorId.get(id)

    try {
      await backendService.updateTask(id, { status: "CONCLUIDA" })
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
      return true
    } catch {
      notifyTaskCompletionError()
      return false
    }
  }, [notifyTaskCompleted, notifyTaskCompletionError, tarefasPorId])

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
          Visão geral da operação Guimicell
        </p>
      </div>

      <KpiGridPrimeira
        faturamentoDiaValor={faturamentoDiaValor}
        faturamentoDiaDescricao={faturamentoDiaDescricao}
        faturamentoMes={faturamentoMes}
        lucroBrutoValor={lucroBrutoValor}
        lucroBrutoDescricao={lucroBrutoDescricao}
        lucroLiquidoMes={lucroLiquidoMes}
        metaMes={metaMes}
        percentualMeta={percentualMeta}
      />

      <KpiGridSegunda despesasMes={despesasMes} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GraficoFinanceiro dados={[]} titulo="Evolução Mensal (6 meses)" />
        <GraficoFinanceiro dados={[]} titulo="Evolução Semanal (dias)" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Leaderboard currentUserId={currentUser?.id} compact />
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
        <PainelCompromissos tarefas={hojeVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
      </div>
    </div>
  )
}
