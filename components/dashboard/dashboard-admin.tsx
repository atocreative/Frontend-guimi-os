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
import {
  mockFinanceiro,
  mockGraficoDiario,
  mockGraficoMensal,
} from "@/app/(dashboard)/data/mock"
import type { ResumoFinanceiroHoje } from "@/lib/foneninja"
import type { TarefaDB } from "@/types/tarefas"

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
}

export function DashboardAdmin({
  tarefasHoje,
  tarefasPendentes,
  faturamentoMes,
  resumoHoje,
}: DashboardAdminProps) {
  const f = mockFinanceiro
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const faturamentoDiaValor = resumoHoje ? brl(resumoHoje.faturamentoDia) : "Indisponível"
  const faturamentoDiaDescricao = resumoHoje ? "Hoje (real)" : "Erro ao carregar dados reais"
  const lucroBrutoValor = resumoHoje ? brl(resumoHoje.lucroBrutoDia) : "Indisponível"
  const lucroBrutoDescricao = resumoHoje
    ? `Margem bruta ${resumoHoje.margemBrutaDia.toFixed(2)}%`
    : "Erro ao carregar dados reais"
  const [riscados, setRiscados] = useState<Set<string>>(new Set())

  const concluirTarefa = useCallback(async (id: string) => {
    const res = await fetch(`/api/tarefas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONCLUIDA" }),
    })
    if (res.ok) {
      setRiscados((prev) => new Set(prev).add(id))
      setTimeout(() => {
        setConcluidos((prev) => new Set(prev).add(id))
        setRiscados((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 700)
    }
    return res.ok
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
          valor={brl(faturamentoMes ?? f.faturamentoMes)}
          descricao={faturamentoMes !== undefined ? "Este mês (real)" : `${f.percentualMeta}% da meta`}
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
          valor={brl(f.lucroLiquido)}
          descricao={`Margem ${f.margemLiquida}%`}
          icone={TrendingUp}
          tendencia="up"
          destaque
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          titulo="A Pagar"
          valor={brl(f.contasPagarMes)}
          descricao="Este mês"
          icone={ArrowDownLeft}
          tendencia="down"
        />
        <KpiCard
          titulo="A Receber"
          valor={brl(f.contasReceberMes)}
          descricao="Este mês"
          icone={ArrowUpRight}
          tendencia="up"
        />
        <KpiCard
          titulo="Total Despesas"
          valor={brl(f.totalDespesas)}
          descricao={`Fixas ${brl(f.despesasFixas)}`}
          icone={Receipt}
          tendencia="down"
        />
        <KpiCard
          titulo="Saldo em Caixa"
          valor={brl(f.saldoCaixa)}
          descricao="Posição atual"
          icone={Wallet}
          tendencia="neutral"
          destaque
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GraficoFinanceiro
          dados={mockGraficoMensal}
          titulo="Evolução Mensal (6 meses)"
        />
        <GraficoFinanceiro
          dados={mockGraficoDiario}
          titulo="Evolução Semanal (dias)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <PodioDashboard />
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
        <PainelCompromissos tarefas={hojeVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
      </div>
    </div>
  )
}
