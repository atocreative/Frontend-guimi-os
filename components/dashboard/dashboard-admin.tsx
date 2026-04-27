"use client"

import { useCallback, useMemo, useState } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { backendService } from "@/lib/services/backend-service"
import type { TarefaDB } from "@/types/tarefas"

export interface ResumoFinanceiroHoje {
  faturamentoDia: number
  lucroBrutoDia: number
  margemBrutaDia: number
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

const PodioDashboard = dynamic(
  () => import("@/components/dashboard/podio-dashboard").then((m) => m.PodioDashboard),
  {
    ssr: false,
    loading: () => (
      <Card><CardContent className="p-6"><Skeleton className="h-[160px] rounded-lg" /></CardContent></Card>
    ),
  }
)

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

interface DashboardAdminProps {
  tarefasHoje: TarefaDB[]
  tarefasPendentes: TarefaDB[]
  faturamentoMes?: number
  resumoHoje?: ResumoFinanceiroHoje
  despesasMes?: number
  lucroLiquidoMes?: number
}

export function DashboardAdmin({
  tarefasHoje,
  tarefasPendentes,
  faturamentoMes,
  resumoHoje,
  despesasMes,
  lucroLiquidoMes,
}: DashboardAdminProps) {
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())

  const faturamentoDiaValor = resumoHoje ? brl(resumoHoje.faturamentoDia) : "—"
  const faturamentoDiaDescricao = resumoHoje ? "Hoje (real)" : "Aguardando dados"
  const lucroBrutoValor = resumoHoje ? brl(resumoHoje.lucroBrutoDia) : "—"
  const lucroBrutoDescricao = resumoHoje
    ? `Margem bruta ${resumoHoje.margemBrutaDia.toFixed(2)}%`
    : "Aguardando dados"

  const concluirTarefa = useCallback(async (id: string) => {
    try {
      await backendService.updateTask(id, { status: "CONCLUIDA" })
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
      return false
    }
  }, [])

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
          valor={faturamentoMes !== undefined ? brl(faturamentoMes) : "—"}
          descricao={faturamentoMes !== undefined ? "Este mês (real)" : "Aguardando dados"}
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
          valor={lucroLiquidoMes !== undefined ? brl(lucroLiquidoMes) : "—"}
          descricao={lucroLiquidoMes !== undefined ? "Este mês (real)" : "Aguardando dados"}
          icone={TrendingUp}
          tendencia="up"
          destaque
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* TODO: API não fornece aPagar — aguardar implementação no backend */}
        <KpiCard titulo="A Pagar" valor="—" descricao="Não disponível na API" icone={ArrowDownLeft} tendencia="down" />
        {/* TODO: API não fornece aReceber — aguardar implementação no backend */}
        <KpiCard titulo="A Receber" valor="—" descricao="Não disponível na API" icone={ArrowUpRight} tendencia="up" />
        <KpiCard
          titulo="Total Despesas"
          valor={despesasMes !== undefined ? brl(despesasMes) : "—"}
          descricao={despesasMes !== undefined ? "Este mês (real)" : "Aguardando dados"}
          icone={Receipt}
          tendencia="down"
        />
        {/* TODO: API não fornece saldo — aguardar implementação no backend */}
        <KpiCard titulo="Saldo em Caixa" valor="—" descricao="Não disponível na API" icone={Wallet} tendencia="neutral" destaque />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GraficoFinanceiro dados={[]} titulo="Evolução Mensal (6 meses)" />
        <GraficoFinanceiro dados={[]} titulo="Evolução Semanal (dias)" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <PodioDashboard />
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
        <PainelCompromissos tarefas={hojeVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
      </div>
    </div>
  )
}
