"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  DollarSign,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GraficoVazio } from "@/components/dashboard/grafico-vazio"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { OrigemLeadsCard } from "@/components/dashboard/origem-leads-card"
import { KpiSkeleton } from "@/components/dashboard/kpi-skeleton"
import { VendedoresRanking } from "@/components/dashboard/vendedores-ranking"
import { PainelTarefas } from "@/components/dashboard/painel-tarefas"
import { PainelAlertasGlobal } from "@/components/dashboard/painel-alertas-global"
import { InsightsPeriodo } from "@/components/dashboard/insights-periodo"
import { useGamificacaoFeedback } from "@/hooks/use-gamificacao-feedback"
import { useDashboardRanking } from "@/hooks/use-dashboard-ranking"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { api, ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import { getDashboardAlerts } from "@/lib/services/dashboard-alerts"
import { GlobalDateFilter } from "@/components/global/global-date-filter"
import { useFinancialConsolidated } from "@/lib/queries/use-financial-consolidated"
import { useFinancialMonthly } from "@/lib/queries/use-financial-monthly"
import { useFinancialDaily } from "@/lib/queries/use-financial-daily"
import { useAlertasOperacionais } from "@/lib/queries/use-alertas-operacionais"
import { useDashboardComercialKPIs } from "@/lib/queries/use-dashboard-comercial-kpis"
import type { DashboardAlert } from "@/lib/services/dashboard-alerts"
import type { TarefaDB } from "@/types/tarefas"
import { getDailyCardMeta } from "@/lib/financeiro-utils"

interface DashboardAdminUser {
  id: string
}

// ─── constantes ───────────────────────────────────────────────────────────────

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

// ─── utilitários ──────────────────────────────────────────────────────────────

const formatBRL = (valor: number) => {
  const n = Number.isFinite(valor) ? valor : 0
  const abs = Math.abs(n)
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)
  return n < 0 ? `-${formatted}` : formatted
}

function toNum(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function isNull(value: unknown): boolean {
  return value === null || value === undefined
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
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()
  const defaultYear = availableYears.filter((year) => year <= currentYear)
  const initialYear = anoProp && anoProp <= currentYear
    ? anoProp
    : defaultYear[defaultYear.length - 1] ?? currentYear

  const [mes, setMes] = useState(mesProp ?? currentMonth)
  const [ano, setAno] = useState(initialYear)
  const [dia, setDia] = useState<number | "">(() => {
    const sameMonth = (mesProp ?? currentMonth) === currentMonth && initialYear === currentYear
    return sameMonth ? currentDay : ""
  })
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())

  const { notifyTaskCompleted, notifyTaskCompletionError } = useGamificacaoFeedback()
  const { entries: rankingEntries, loading: rankingLoading } = useDashboardRanking({ mes, ano })
  const { data: alertasOp } = useAlertasOperacionais()
  const { data: comercialKPIs } = useDashboardComercialKPIs()

  const diasDisponiveis = useMemo(() => {
    const total = new Date(ano, mes + 1, 0).getDate()
    const maxDay = ano === currentYear && mes === currentMonth ? currentDay : total
    return Array.from({ length: maxDay }, (_, i) => i + 1)
  }, [ano, mes, currentYear, currentMonth, currentDay])

  const diaValido = dia !== "" && dia <= diasDisponiveis.length ? dia : ""

  useEffect(() => {
    if (dia !== "" && dia > diasDisponiveis.length) setDia("")
  }, [dia, diasDisponiveis.length])

  // ── queries — cache keys isolados, nunca compartilhados ────────────────────
  // monthlyQuery: dados do mês visualizado
  const monthlyQuery = useFinancialMonthly(ano, mes + 1)
  // todayQuery: sempre mês corrente — garante "Lucro de Hoje" ao navegar para meses anteriores
  // Quando mes/ano === hoje, React Query deduplicata via mesma query key, sem request duplo
  const todayQuery   = useFinancialMonthly(currentYear, currentMonth + 1)
  // prevMonthQuery: mês anterior para comparativo de insights
  const prevMes1     = mes === 0 ? 11 : mes - 1
  const prevAno1     = mes === 0 ? ano - 1 : ano
  const prevMonthQuery = useFinancialMonthly(prevAno1, prevMes1 + 1)
  // dailyQuery: dia selecionado — desabilitado quando nenhum dia está ativo
  const dailyQuery   = useFinancialDaily(ano, mes + 1, diaValido !== "" ? (diaValido as number) : null)

  // ── KPIs mensais — derivados do monthlyQuery ────────────────────────────────
  const md = monthlyQuery.data
  const loadingKpi = monthlyQuery.isLoading && !md
  const erroFetch  = monthlyQuery.isError

  const faturamento  = toNum(md?.faturamentoMes ?? md?.financeiro?.receita)
  const lucro        = toNum(md?.lucroOperacionalMes ?? md?.financeiro?.grossProfit)
  const totalVendas  = toNum(md?.totalVendas)
  const margemBruta  = toNum(md?.margemBruta)

  const lucroNulo       = !md || isNull(md.lucroOperacionalMes)
  const totalVendasNulo = !md || isNull(md.totalVendas)
  const updatedAt       = md?.updatedAt ?? null

  // ── KPIs diários ────────────────────────────────────────────────────────────
  const faturamentoHoje         = todayQuery.data?.faturamentoDia ?? null
  const lucroLiquidoHoje        = todayQuery.data?.lucroLiquidoDia ?? null
  const faturamentoDiaSelecionado = dailyQuery.data?.faturamentoDia ?? null
  const lucroLiquidoDiaSelecionado = dailyQuery.data?.lucroLiquidoDia ?? null

  const faturamentoDia = diaValido !== ""
    ? Number(faturamentoDiaSelecionado ?? 0)
    : Number(faturamentoHoje ?? 0)
  const faturamentoDiaNulo = diaValido !== ""
    ? isNull(faturamentoDiaSelecionado)
    : isNull(faturamentoHoje)
  const lucroLiquidoDia = diaValido !== ""
    ? lucroLiquidoDiaSelecionado
    : lucroLiquidoHoje

  const dailyCardMeta = getDailyCardMeta({
    dia: diaValido !== "" ? (diaValido as number) : null,
    mes: diaValido !== "" ? mes : currentMonth,
    ano: diaValido !== "" ? ano : currentYear,
    mesAtual: currentMonth,
    anoAtual: currentYear,
    diaAtual: currentDay,
    lucroLiquidoDia,
  })

  // ── Consolidado financeiro (source of truth — mesmos bindings do Financeiro) ──
  const consolidadoQuery = useFinancialConsolidated(ano, mes + 1)
  const consolidado = consolidadoQuery.data
  const lucroLiquidoReal    = toNum(consolidado?.realCompanyProfit)
  const lucroLiquidoFN      = toNum(consolidado?.netProfit)
  const margemReal          = toNum(consolidado?.realMargin)
  const adminExpenses       = toNum(consolidado?.administrativeExpenses)
  const maCount             = consolidado?.breakdown?.meuAssessor?.count ?? 0
  const maAvailable         = !consolidadoQuery.isLoading && !consolidadoQuery.isError && maCount > 0

  const grossProfitCanonical = toNum(consolidado?.grossProfit)
  const margemBrutaEffective = consolidado && faturamento > 0 && grossProfitCanonical > 0
    ? (grossProfitCanonical / faturamento) * 100
    : margemBruta

  const lucroInconsistente = !loadingKpi && !lucroNulo && lucro > 0 && lucro === faturamento

  // ── alertas agregados ─────────────────────────────────────────────────────────
  const alertas = useMemo((): DashboardAlert[] => {
    const now = new Date().toISOString()
    const all: Array<DashboardAlert & { score: number }> = []
    const push = (a: DashboardAlert, score: number) => all.push({ ...a, score })

    const base = getDashboardAlerts({
      role: "ADMIN",
      faturamentoDia,
      loadingKpi,
      tarefasPendentes,
      isHoje: diaValido === "" && mes === currentMonth && ano === currentYear,
      comercialKPIs: comercialKPIs ?? null,
    })
    base.forEach((a, i) => push(a, 400 - i * 10))

    if (!loadingKpi && faturamento > 0 && consolidado && maAvailable) {
      const finAlerts: Array<{ a: DashboardAlert; score: number }> = []

      if (lucroLiquidoReal < 0) {
        finAlerts.push({ score: 380, a: {
          id: "lucro-negativo", severity: "critical",
          title: "Lucro líquido negativo",
          description: `Prejuízo de ${formatBRL(Math.abs(lucroLiquidoReal))} no período.`,
          source: "financeiro",
          tooltip: "Origem: Financeiro\nRegra: lucroLiquidoReal < 0",
          timestamp: now,
        }})
      }
      if (margemReal > 0 && margemReal < 3) {
        finAlerts.push({ score: 320, a: {
          id: "margem-real-baixa", severity: "critical",
          title: "Margem real abaixo de 3%",
          description: `Margem atual: ${margemReal.toFixed(1)}%. Revisar despesas administrativas.`,
          source: "financeiro",
          tooltip: "Origem: Financeiro\nRegra: margemReal < 3%",
          timestamp: now,
        }})
      }
      if (margemBrutaEffective < 10) {
        finAlerts.push({ score: 280, a: {
          id: "margem-bruta-critica", severity: "warning",
          title: "Margem bruta crítica",
          description: `Margem bruta: ${margemBrutaEffective.toFixed(1)}%. Verifique CMV.`,
          source: "financeiro",
          tooltip: "Origem: Financeiro\nRegra: margemBruta < 10%",
          timestamp: now,
        }})
      }
      if (adminExpenses > 0 && lucroLiquidoReal > 0 && adminExpenses > lucroLiquidoReal) {
        finAlerts.push({ score: 310, a: {
          id: "admin-consome-lucro", severity: "critical",
          title: "Despesas admin superam lucro líquido",
          description: "Custos administrativos excedem o lucro líquido real.",
          source: "financeiro",
          tooltip: "Origem: Financeiro\nRegra: adminExpenses > lucroLiquidoReal",
          timestamp: now,
        }})
      }

      finAlerts
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .forEach(({ a, score }) => push(a, score))
    }

    if (alertasOp) {
      const opAlerts: Array<{ a: DashboardAlert; score: number }> = []
      const { estoqueCritico, reposicaoRecomendada, estoqueParado } = alertasOp

      if (estoqueCritico.length > 0) {
        opAlerts.push({ score: 260, a: {
          id: "estoque-critico", severity: "critical",
          title: `${estoqueCritico.length} produto${estoqueCritico.length > 1 ? "s" : ""} com estoque crítico`,
          description: estoqueCritico.slice(0, 2).map(p => p.produto).join(", ") + (estoqueCritico.length > 2 ? " e outros" : ""),
          source: "operacao",
          tooltip: "Origem: Operação\nRegra: Estoque abaixo do mínimo operacional",
          timestamp: now,
        }})
      }
      if (reposicaoRecomendada.length > 0) {
        opAlerts.push({ score: 210, a: {
          id: "reposicao-recomendada", severity: "warning",
          title: `${reposicaoRecomendada.length} produto${reposicaoRecomendada.length > 1 ? "s" : ""} para reposição`,
          description: reposicaoRecomendada.slice(0, 2).map(p => p.produto).join(", ") + (reposicaoRecomendada.length > 2 ? " e outros" : ""),
          source: "operacao",
          tooltip: "Origem: Operação\nRegra: Estoque abaixo do giro dos últimos 30 dias",
          timestamp: now,
        }})
      }
      if (estoqueParado.length > 0 && opAlerts.length < 2) {
        opAlerts.push({ score: 150, a: {
          id: "estoque-parado", severity: "info",
          title: `${estoqueParado.length} produto${estoqueParado.length > 1 ? "s" : ""} sem movimentação`,
          description: `Maior parado: ${estoqueParado[0]?.produto ?? "—"} (${estoqueParado[0]?.diasParado ?? 0} dias).`,
          source: "operacao",
          tooltip: "Origem: Operação\nRegra: Produto sem movimentação por período prolongado",
          timestamp: now,
        }})
      }

      opAlerts
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .forEach(({ a, score }) => push(a, score))
    }

    if (!rankingLoading && rankingEntries.length > 0) {
      const lider = rankingEntries[0]
      push({
        id: "ranking-lider", severity: "info",
        title: `Líder: ${lider.userName}`,
        description: `Score ${lider.score} · ${lider.tarefasConcluidas} tarefas concluídas no período.`,
        source: "ranking",
        tooltip: "Origem: Ranking\nRegra: Colaborador com maior score no período",
        timestamp: now,
      }, 120)

      const melhorStreak = [...rankingEntries].sort((a, b) => b.streak - a.streak)[0]
      if (melhorStreak && melhorStreak.streak >= 3) {
        push({
          id: "ranking-streak", severity: "info",
          title: `Sequência: ${melhorStreak.userName}`,
          description: `${melhorStreak.streak} dias consecutivos de atividade.`,
          source: "ranking",
          tooltip: "Origem: Ranking\nRegra: Maior streak de atividade contínua",
          timestamp: now,
        }, 100)
      }
    }

    const ORDER = { critical: 0, warning: 1, info: 2 } as const
    return all
      .sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || b.score - a.score)
      .map(({ score: _s, ...rest }) => rest)
      .slice(0, 8)
  }, [
    faturamentoDia, loadingKpi, tarefasPendentes, comercialKPIs,
    diaValido, mes, ano, currentMonth, currentYear,
    faturamento, lucroLiquidoReal, margemReal, margemBrutaEffective, adminExpenses,
    alertasOp, rankingEntries, rankingLoading,
  ])

  const dadosGrafico = useMemo(() =>
    (md?.grafico ?? []).map((item) => ({
      dia:         item.data,
      faturamento: Number(item.entradas ?? 0),
      despesas:    Number(item.saidas   ?? 0),
      lucro:       Number(item.saldo    ?? 0),
    })),
    [md]
  )

  const tendencia = useMemo((): "up" | "down" | "neutral" => {
    if (dadosGrafico.length < 4) return "neutral"
    const mid = Math.floor(dadosGrafico.length / 2)
    const avgFirst  = dadosGrafico.slice(0, mid).reduce((s, d) => s + d.faturamento, 0) / mid
    const avgSecond = dadosGrafico.slice(mid).reduce((s, d) => s + d.faturamento, 0) / (dadosGrafico.length - mid)
    const diff = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0
    if (diff > 5) return "up"
    if (diff < -5) return "down"
    return "neutral"
  }, [dadosGrafico])

  const prevLucroBruto = toNum(prevMonthQuery.data?.lucroOperacionalMes ?? prevMonthQuery.data?.financeiro?.grossProfit)

  // ── tarefas ─────────────────────────────────────────────────────────────────
  const tarefasPorId = useMemo(
    () => new Map([...tarefasHoje, ...tarefasPendentes].map((t) => [t.id, t])),
    [tarefasHoje, tarefasPendentes]
  )

  const concluirTarefa = useCallback(async (id: string) => {
    const tarefa = tarefasPorId.get(id)
    try {
      await api.completeTask(id)
      notifyTaskCompleted({ taskTitle: tarefa?.title })
      setRiscados((prev) => new Set(prev).add(id))
      setTimeout(() => {
        setConcluidos((prev) => new Set(prev).add(id))
        setRiscados((prev) => { const n = new Set(prev); n.delete(id); return n })
      }, 700)
      return true
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        toast.error("Tarefa atrasada requer justificativa. Acesse a Agenda para concluí-la.")
        return false
      }
      notifyTaskCompletionError()
      return false
    }
  }, [notifyTaskCompleted, notifyTaskCompletionError, tarefasPorId])

  const pendentesVisiveis = useMemo(
    () => tarefasPendentes.filter((t) => !concluidos.has(t.id)),
    [tarefasPendentes, concluidos]
  )

  // ── date filter handlers ─────────────────────────────────────────────────────
  const handleMonthChange = useCallback((m: number, y: number) => {
    setMes(m)
    setAno(y)
  }, [])

  const handleToday = useCallback(() => {
    setMes(currentMonth)
    setAno(currentYear)
    setDia(currentDay)
  }, [currentMonth, currentYear, currentDay])

  const handleDateSelect = useCallback((date: Date | null) => {
    if (!date) { setDia(""); return }
    setMes(date.getMonth())
    setAno(date.getFullYear())
    setDia(date.getDate())
  }, [])

  const selectedDate = diaValido !== "" ? new Date(ano, mes, diaValido as number) : null

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          {loadingKpi && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {monthlyQuery.isFetching && !loadingKpi && (
            <span className="text-xs text-muted-foreground/60 animate-pulse">Atualizando dados…</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Visão geral da operação Guimicell</p>
        {updatedAt && (
          <p className="text-xs text-muted-foreground">
            Atualizado às{" "}
            {new Date(updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

      </div>

      {/* ── Filtro de período ──────────────────────────────────────────────── */}
      <GlobalDateFilter
        month={mes}
        year={ano}
        selectedDate={selectedDate}
        maxDate={new Date(currentYear, currentMonth, currentDay)}
        onMonthChange={handleMonthChange}
        onToday={handleToday}
        onDateSelect={handleDateSelect}
      />

      {/* ── Linha 1: 4 KPIs (mesmo dado/visual do Financeiro) ─────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {loadingKpi ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton destaque />
            <KpiSkeleton />
          </>
        ) : (
          <>
            {/* 1. Lucro Líquido do Dia */}
            <KpiCard
              titulo="Lucro Líquido do Dia"
              valor={formatBRL(toNum(lucroLiquidoDia))}
              descricao={dailyCardMeta.descricao}
              icone={DollarSign}
              tendencia={toNum(lucroLiquidoDia) >= 0 ? "up" : "down"}
              accent={toNum(lucroLiquidoDia) >= 0 ? "positive" : "negative"}
            />
            {/* 2. Lucro Bruto do Mês */}
            <KpiCard
              titulo="Lucro Bruto do Mês"
              valor={formatBRL(lucro)}
              descricao={`${MESES[mes]} ${ano}`}
              icone={Target}
              tendencia="up"
              accent="info"
            />
            {/* 3. Lucro Líquido Real */}
            <KpiCard
              titulo="Lucro Líquido Real"
              valor={consolidadoQuery.isLoading && !consolidado ? "…" : formatBRL(maAvailable ? lucroLiquidoReal : lucroLiquidoFN)}
              descricao={maAvailable ? `Margem real ${margemReal.toFixed(1)}%` : faturamento > 0 ? `Margem ${((lucroLiquidoFN / faturamento) * 100).toFixed(1)}%` : `${MESES[mes]} ${ano}`}
              icone={TrendingUp}
              tendencia={lucroLiquidoReal >= 0 ? "up" : "down"}
              accent={lucroLiquidoReal >= 0 ? "positive" : "negative"}
              destaque
            />
            {/* 4. Total Vendas no Mês */}
            <KpiCard
              titulo="Total Vendas no Mês"
              valor={totalVendas > 0 ? String(totalVendas) : "—"}
              descricao="Vendas consolidadas"
              icone={ShoppingCart}
              tendencia={totalVendas > 0 ? "up" : "neutral"}
            />
          </>
        )}
      </div>


      {/* ── Linha 3: Insights do Período ─────────────────────────────────── */}
      <InsightsPeriodo
        mes={mes}
        ano={ano}
        lucroBrutoMes={lucro}
        lucroLiquidoReal={maAvailable ? lucroLiquidoReal : null}
        margemReal={margemReal}
        prevLucroBruto={prevLucroBruto > 0 ? prevLucroBruto : null}
        loading={loadingKpi}
        tendencia={tendencia}
        alertasCriticos={alertas.filter(a => a.severity === "critical").length}
        alertasAvisos={alertas.filter(a => a.severity === "warning").length}
      />

      {/* ── Linha 4: Central de Alertas ───────────────────────────────────── */}
      <PainelAlertasGlobal alerts={alertas} />

      {/* ── Linha 5: Gráficos + Origem de Leads ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          {dadosGrafico.length > 0 ? (
            <GraficoFinanceiro dados={dadosGrafico} titulo={`Lucro Médio Diário — ${MESES[mes]} ${ano}`} />
          ) : !loadingKpi ? (
            <GraficoVazio mensagem={`Sem dados para ${MESES[mes]} ${ano}`} />
          ) : (
            <Card><CardContent className="p-6"><Skeleton className="h-[240px] rounded-lg" /></CardContent></Card>
          )}
        </div>
        <OrigemLeadsCard />
      </div>

      {/* ── Linha 6: Ranking + Tarefas lado a lado ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VendedoresRanking entries={rankingEntries} loading={rankingLoading} />
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
      </div>

    </div>
  )
}
