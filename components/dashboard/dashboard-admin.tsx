"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  DollarSign,
  PiggyBank,
  Receipt,
  ShoppingCart,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { VendedoresRanking } from "@/components/dashboard/vendedores-ranking"
import { PainelCompromissos } from "@/components/dashboard/painel-compromissos"
import { PainelTarefas } from "@/components/dashboard/painel-tarefas"
import { Leaderboard } from "@/components/gamificacao/leaderboard"
import { useGamificacaoFeedback } from "@/hooks/use-gamificacao-feedback"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { backendService } from "@/lib/services/backend-service"
import { type IndicadoresGeral, type OverviewExtra } from "@/lib/services/api"
import { getDashboardSummary } from "@/lib/services/dashboard-summary"
import type { TarefaDB } from "@/types/tarefas"

interface DashboardAdminUser {
  id: string
}

// ─── constantes ───────────────────────────────────────────────────────────────

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]


// ─── utilitários ──────────────────────────────────────────────────────────────

const formatBRL = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)

function gerarPeriodo(mes: number, ano: number) {
  const start = new Date(Date.UTC(ano, mes, 1))
  const end = new Date(Date.UTC(ano, mes + 1, 1) - 1)
  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

const INDICADORES_ZERO: IndicadoresGeral = {
  faturamento: 0, despesas: 0, compras: 0, lucro: 0,
  ticketMedio: 0, estoqueTotal: 0, conversao: 0,
}

function toNum(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

// ─── componentes lazy ─────────────────────────────────────────────────────────

const GraficoFinanceiro = dynamic(
  () => import("@/components/dashboard/grafico-financeiro").then((m) => m.GraficoFinanceiro),
  {
    ssr: false,
    loading: () => (
      <Card><CardContent className="p-6"><Skeleton className="h-[240px] rounded-lg" /></CardContent></Card>
    ),
  }
)

// ─── props ────────────────────────────────────────────────────────────────────

interface DashboardAdminProps {
  tarefasHoje: TarefaDB[]
  tarefasPendentes: TarefaDB[]
  currentUser?: DashboardAdminUser
  mes?: number
  ano?: number
  availableYears: number[]
}

// ─── componente principal ─────────────────────────────────────────────────────

export function DashboardAdmin({
  tarefasHoje,
  tarefasPendentes,
  currentUser,
  mes: mesProp,
  ano: anoProp,
  availableYears,
}: DashboardAdminProps) {
  const [mes, setMes] = useState(mesProp ?? 0)
  const [ano, setAno] = useState(anoProp ?? availableYears[availableYears.length - 1] ?? 2024)

  const [indicadores, setIndicadores] = useState<IndicadoresGeral>(INDICADORES_ZERO)
  const [loadingKpi, setLoadingKpi] = useState(true)
  const [overviewExtra, setOverviewExtra] = useState<OverviewExtra | null>(null)

  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())
  const { notifyTaskCompleted, notifyTaskCompletionError } = useGamificacaoFeedback()

  // ── fetch via /api/dashboard/summary ────────────────────────────────────────
  const fetchDados = useCallback(async (m: number, a: number) => {
    setLoadingKpi(true)
    try {
      const { startDate, endDate } = gerarPeriodo(m, a)
      const summary = await getDashboardSummary({ startDate, endDate })
      if (summary) {
        setIndicadores({
          faturamento: toNum(summary.faturamentoMes ?? summary.financeiro?.receita),
          despesas:    toNum(summary.despesasMes ?? summary.financeiro?.despesasVariaveis),
          compras:     toNum(summary.comprasMes),
          lucro:       toNum(summary.lucroLiquidoMes ?? summary.financeiro?.netProfit),
          ticketMedio: toNum(summary.ticketMedio),
          estoqueTotal: 0,
          conversao:   0,
        })
        setOverviewExtra({
          grafico: (summary.grafico ?? []).map((item) => ({
            dia:     item.data,
            receita: item.entradas,
            custo:   item.saidas,
            lucro:   item.saldo,
          })),
          resumo: { faturamentoDia: toNum(summary.faturamentoDia) },
        })
      } else {
        setIndicadores(INDICADORES_ZERO)
        setOverviewExtra(null)
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
      setIndicadores(INDICADORES_ZERO)
    } finally {
      setLoadingKpi(false)
    }
  }, [])

  useEffect(() => { fetchDados(mes, ano) }, [mes, ano, fetchDados])

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const { faturamento, despesas, lucro, ticketMedio, estoqueTotal, conversao } = indicadores
  const faturamentoDia = Number(overviewExtra?.resumo?.faturamentoDia ?? 0)
  const saldoCaixa = Math.max(0, faturamento - despesas)

  const dadosGrafico = useMemo(() =>
    (overviewExtra?.grafico ?? []).map((item) => ({
      mes: item.mes,
      dia: item.dia,
      faturamento: Number(item.receita ?? 0),
      despesas:    Number(item.custo   ?? 0),
      lucro:       Number(item.lucro   ?? 0),
    })),
    [overviewExtra]
  )

  // ── tarefas ─────────────────────────────────────────────────────────────────
  const tarefasPorId = useMemo(
    () => new Map([...tarefasHoje, ...tarefasPendentes].map((t) => [t.id, t])),
    [tarefasHoje, tarefasPendentes]
  )

  const concluirTarefa = useCallback(async (id: string) => {
    const tarefa = tarefasPorId.get(id)
    try {
      await backendService.updateTask(id, { status: "CONCLUIDA" })
      notifyTaskCompleted({ taskTitle: tarefa?.title })
      setRiscados((prev) => new Set(prev).add(id))
      setTimeout(() => {
        setConcluidos((prev) => new Set(prev).add(id))
        setRiscados((prev) => { const n = new Set(prev); n.delete(id); return n })
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

  const load = (v: string) => loadingKpi ? "…" : v

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Cabeçalho + filtro de período */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Visão geral da operação Guimicell</p>
        </div>

        <div className="flex gap-2">
          <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((nome, i) => (
                <SelectItem key={i} value={String(i)}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableYears.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs — linha 1: receita */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          titulo="Faturamento do Dia"
          valor={load(formatBRL(faturamentoDia))}
          descricao={faturamentoDia > 0 ? "Hoje (real)" : "Aguardando dados"}
          icone={DollarSign}
          tendencia="up"
        />
        <KpiCard
          titulo="Faturamento do Mês"
          valor={load(formatBRL(faturamento))}
          descricao={`${MESES[mes]} ${ano}`}
          icone={Target}
          tendencia="up"
        />
        <KpiCard
          titulo="Lucro Líquido"
          valor={load(formatBRL(lucro))}
          descricao="Fat. − despesas − compras"
          icone={TrendingUp}
          tendencia={lucro >= 0 ? "up" : "down"}
          destaque
        />
        <KpiCard
          titulo="Ticket Médio"
          valor={load(formatBRL(ticketMedio))}
          descricao="Por venda (real)"
          icone={ShoppingCart}
          tendencia="up"
        />
      </div>

      {/* KPIs — linha 2: custos e posição */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          titulo="Taxa de Conversão"
          valor={load((conversao * 100).toFixed(1) + "%")}
          descricao="Convertidas / Pendentes"
          icone={Target}
          tendencia="up"
        />
        <KpiCard
          titulo="Total Despesas"
          valor={load(formatBRL(despesas))}
          descricao="Contas a pagar (real)"
          icone={Receipt}
          tendencia="down"
        />
        <KpiCard
          titulo="Estoque Total"
          valor={load(formatBRL(estoqueTotal))}
          descricao="Valor em estoque (real)"
          icone={Wallet}
          tendencia="neutral"
        />
        <KpiCard
          titulo="Saldo em Caixa"
          valor={load(formatBRL(saldoCaixa))}
          descricao="Fat. − despesas"
          icone={PiggyBank}
          tendencia={saldoCaixa > 0 ? "up" : "down"}
          destaque
        />
      </div>

      {/* Gráfico */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GraficoFinanceiro dados={dadosGrafico} titulo={`Evolução — ${MESES[mes]} ${ano}`} />
        <GraficoFinanceiro dados={[]} titulo="Evolução Semanal (dias)" />
      </div>

      {/* Ranking de vendedores */}
      <VendedoresRanking vendedores={overviewExtra?.vendedores ?? []} loading={loadingKpi} />

      {/* Painéis */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Leaderboard currentUserId={currentUser?.id} compact />
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
        <PainelCompromissos tarefas={hojeVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
      </div>

    </div>
  )
}
