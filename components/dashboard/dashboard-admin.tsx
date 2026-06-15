"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  DollarSign,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingUp,
  Percent,
  BarChart2,
  Receipt,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GraficoVazio } from "@/components/dashboard/grafico-vazio"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { OrigemLeadsCard } from "@/components/dashboard/origem-leads-card"
import { KpiSkeleton } from "@/components/dashboard/kpi-skeleton"
import { VendedoresRanking } from "@/components/dashboard/vendedores-ranking"
import { PainelTarefas } from "@/components/dashboard/painel-tarefas"
import { PainelAlertasGlobal } from "@/components/dashboard/painel-alertas-global"
import { useGamificacaoFeedback } from "@/hooks/use-gamificacao-feedback"
import { useIntegrationStatus } from "@/hooks/use-integration-status"
import { useDashboardRanking } from "@/hooks/use-dashboard-ranking"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { backendService } from "@/lib/services/backend-service"
import { type IndicadoresGeral, type OverviewExtra } from "@/lib/services/api"
import { getDashboardSummary } from "@/lib/services/dashboard-summary"
import { getDashboardAlerts } from "@/lib/services/dashboard-alerts"
import { GlobalDateFilter } from "@/components/global/global-date-filter"
import { useFinanceiroConsolidado } from "@/lib/queries/use-financeiro-consolidado"
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

function gerarPeriodo(mes: number, ano: number, dia?: number) {
  if (dia) {
    const start = new Date(Date.UTC(ano, mes, dia))
    const end = new Date(Date.UTC(ano, mes, dia + 1) - 1)
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }

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
  // Default filter = HOJE (mesmo comportamento do /financeiro)
  const [dia, setDia] = useState<number | "">(() => {
    const sameMonth = (mesProp ?? currentMonth) === currentMonth && initialYear === currentYear
    return sameMonth ? currentDay : ""
  })
  const [indicadores, setIndicadores] = useState<IndicadoresGeral>(INDICADORES_ZERO)
  const [totalVendas, setTotalVendas] = useState(0)
  const [margemBruta, setMargemBruta] = useState(0)
  const [margemLiquida, setMargemLiquida] = useState(0)
  const [lucroLiquido, setLucroLiquido] = useState(0)
  const [loadingKpi, setLoadingKpi] = useState(true)
  const [overviewExtra, setOverviewExtra] = useState<OverviewExtra | null>(null)
  const [faturamentoDiaSelecionado, setFaturamentoDiaSelecionado] = useState<number | null>(null)
  const [faturamentoHoje, setFaturamentoHoje] = useState<number | null>(null)
  const [lucroLiquidoDiaSelecionado, setLucroLiquidoDiaSelecionado] = useState<number | null>(null)
  const [lucroLiquidoHoje, setLucroLiquidoHoje] = useState<number | null>(null)
  const [erroFetch, setErroFetch] = useState(false)
  const [sourceType, setSourceType] = useState<string | null>(null)
  const [nullFlags, setNullFlags] = useState({ lucro: false, totalVendas: false })


  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())
  const { notifyTaskCompleted, notifyTaskCompletionError } = useGamificacaoFeedback()
  const { status: integrationStatus } = useIntegrationStatus()
  const { entries: rankingEntries, loading: rankingLoading } = useDashboardRanking({ mes, ano })
  const { data: alertasOp } = useAlertasOperacionais()
  const { data: comercialKPIs } = useDashboardComercialKPIs()
  const diasDisponiveis = useMemo(() => {
    const total = new Date(ano, mes + 1, 0).getDate()
    // Limit to current day if viewing current month/year
    const maxDay = ano === currentYear && mes === currentMonth ? currentDay : total
    return Array.from({ length: maxDay }, (_, i) => i + 1)
  }, [ano, mes, currentYear, currentMonth, currentDay])
  const diaValido = dia !== "" && dia <= diasDisponiveis.length ? dia : ""

  useEffect(() => {
    if (dia !== "" && dia > diasDisponiveis.length) {
      setDia("")
    }
  }, [dia, diasDisponiveis.length])
  // ── fetch via /api/dashboard/summary ────────────────────────────────────────
  const fetchMensal = useCallback(async (m: number, a: number) => {
    setLoadingKpi(true)
    setErroFetch(false)
    try {
      // /api/dashboard/summary aceita month 1-indexed (Jan=1)
      const monthlySummary = await getDashboardSummary({ year: a, month: m + 1 })
      if (monthlySummary) {
        // grossProfit = lucro oficial FoneNinja; netProfit = lucro contábil interno
        const lucroRaw = monthlySummary.lucroOperacionalMes ?? monthlySummary.financeiro?.grossProfit
        const lucroLiquidoRaw = monthlySummary.lucroLiquidoMes ?? monthlySummary.financeiro?.netProfit
        const totalVendasRaw = monthlySummary.totalVendas
        setNullFlags({
          lucro: isNull(lucroRaw),
          totalVendas: isNull(totalVendasRaw),
        })
        const fat = toNum(monthlySummary.faturamentoMes ?? monthlySummary.financeiro?.receita)
        const gross = toNum(lucroRaw)
        const net = toNum(lucroLiquidoRaw)
        setIndicadores({
          faturamento:  fat,
          despesas:     toNum(monthlySummary.despesasMes ?? monthlySummary.financeiro?.despesasVariaveis),
          compras:      toNum(monthlySummary.comprasMes),
          lucro:        gross,
          ticketMedio:  toNum(monthlySummary.ticketMedio),
          estoqueTotal: 0,
          conversao:    0,
        })
        setMargemBruta(toNum(monthlySummary.margemBruta ?? (fat > 0 ? (gross / fat) * 100 : 0)))
        setMargemLiquida(toNum(monthlySummary.margemLiquida ?? (fat > 0 ? (net / fat) * 100 : 0)))
        setLucroLiquido(net)
        setTotalVendas(toNum(totalVendasRaw))
        setSourceType((monthlySummary as any).sourceType ?? monthlySummary._meta?.sourceType ?? null)
        setOverviewExtra({
          grafico: (monthlySummary.grafico ?? []).map((item) => ({
            dia:     item.data,
            receita: item.entradas,
            custo:   item.saidas,
            lucro:   item.saldo,
          })),
          resumo: { faturamentoDia: toNum(monthlySummary.faturamentoDia) },
          // @ts-ignore - vendedores may come from backend even if not in type yet
          vendedores: (monthlySummary as any).rankingVendedores ?? (monthlySummary as any).vendedores ?? undefined,
        })
        // Mês atual: reutiliza faturamentoDia do resumo → elimina fetchHoje no mount
        if (m === currentMonth && a === currentYear) {
          setFaturamentoHoje(toNum(monthlySummary.faturamentoDia))
          setLucroLiquidoHoje(monthlySummary.lucroLiquidoDia ?? null)
        }
      }
      // se null, mantém dados anteriores — não zera tudo
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
      setErroFetch(true)
      // mantém dados anteriores visíveis
    } finally {
      setLoadingKpi(false)
    }
  }, [currentMonth, currentYear])

  // Always fetches today — independent of the month/year filter
  const fetchHoje = useCallback(async () => {
    try {
      const s = await getDashboardSummary({ year: currentYear, month: currentMonth + 1, day: currentDay })
      setFaturamentoHoje(s ? toNum(s.faturamentoDia) : null)
      setLucroLiquidoHoje(s?.lucroLiquidoDia ?? null)
    } catch {
      setFaturamentoHoje(null)
      setLucroLiquidoHoje(null)
    }
  }, [currentYear, currentMonth, currentDay])

  // Fetches the selected day within the viewed month
  const fetchDiario = useCallback(async (m: number, a: number, d: number | "") => {
    if (d === "") {
      setFaturamentoDiaSelecionado(null)
      return
    }
    // fetchHoje já cobre hoje — sync via efeito abaixo, sem request duplicado
    if (d === currentDay && m === currentMonth && a === currentYear) return
    try {
      const s = await getDashboardSummary({ year: a, month: m + 1, day: d })
      setFaturamentoDiaSelecionado(s ? toNum(s.faturamentoDia) : null)
      setLucroLiquidoDiaSelecionado(s?.lucroLiquidoDia ?? null)
    } catch {
      setFaturamentoDiaSelecionado(null)
      setLucroLiquidoDiaSelecionado(null)
    }
  }, [currentDay, currentMonth, currentYear])

  useEffect(() => { fetchMensal(mes, ano) }, [mes, ano, fetchMensal])
  // fetchHoje só dispara em meses passados — mês atual recebe faturamentoDia via fetchMensal
  useEffect(() => {
    if (mes !== currentMonth || ano !== currentYear) fetchHoje()
  }, [fetchHoje, mes, ano, currentMonth, currentYear])
  useEffect(() => { fetchDiario(mes, ano, diaValido === "" ? "" : diaValido) }, [mes, ano, diaValido, fetchDiario])
  // Propaga hoje → diário quando dia selecionado = hoje (evita request duplo)
  useEffect(() => {
    if (diaValido !== "" && diaValido === currentDay && mes === currentMonth && ano === currentYear) {
      setFaturamentoDiaSelecionado(faturamentoHoje)
      setLucroLiquidoDiaSelecionado(lucroLiquidoHoje)
    }
  }, [diaValido, faturamentoHoje, lucroLiquidoHoje, currentDay, mes, currentMonth, ano, currentYear])

  // ── Consolidado financeiro (source of truth — mesmos bindings do Financeiro) ──
  const consolidadoQuery = useFinanceiroConsolidado(ano, mes + 1)
  const consolidado = consolidadoQuery.data
  const lucroLiquidoReal = toNum(consolidado?.realCompanyProfit)
  const margemReal = toNum(consolidado?.realMargin)
  const adminExpenses = toNum(consolidado?.administrativeExpenses)
  // grossProfitCanonical computed after faturamento is available (see below)


  // ── KPIs ────────────────────────────────────────────────────────────────────
  const { faturamento, lucro } = indicadores
  // grossProfit canônico: consolidado primeiro (= FinanceiroFiltrado), fallback → summary
  const grossProfitCanonical = toNum(consolidado?.grossProfit ?? lucro)
  const margemBrutaEffective = consolidado && faturamento > 0
    ? (grossProfitCanonical / faturamento) * 100
    : margemBruta
  // Day card: uses selected day if active, otherwise always shows today
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

  // Null-awareness: valores que o backend não retornou (null) ≠ zero real
  const lucroNulo = nullFlags.lucro
  const totalVendasNulo = nullFlags.totalVendas

  // Warning: lucro === faturamento indica dado inconsistente (backend não separou despesas)
  const lucroInconsistente = !loadingKpi && !lucroNulo && lucro > 0 && lucro === faturamento

  // ── alertas agregados ─────────────────────────────────────────────────────────
  const alertas = useMemo((): DashboardAlert[] => {
    const now = new Date().toISOString()
    const all: Array<DashboardAlert & { score: number }> = []
    const push = (a: DashboardAlert, score: number) => all.push({ ...a, score })

    // ── Tarefas + Vendas + Comercial (via getDashboardAlerts) ───────────────
    const base = getDashboardAlerts({
      role: "ADMIN",
      faturamentoDia,
      loadingKpi,
      tarefasPendentes: tarefasPendentes,
      isHoje: diaValido === "" && mes === currentMonth && ano === currentYear,
      comercialKPIs: comercialKPIs ?? null,
    })
    base.forEach((a, i) => push(a, 400 - i * 10))

    // ── Financeiro (max 2) — fonte: consolidado ───────────────────────────────
    if (!loadingKpi && faturamento > 0) {
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

    // ── Operação (max 2) — fonte: useAlertasOperacionais ─────────────────────
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

    // ── Ranking (max 2) — fonte: rankingEntries ───────────────────────────────
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

    // ── Ordenar: critical → warning → info, depois score, cap 8 ─────────────
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
  const load = (v: string) => loadingKpi ? "…" : v

  // ── date filter handlers ─────────────────────────────────────────────────────
  const handleMonthChange = useCallback((m: number, y: number) => {
    setMes(m)
    setAno(y)
    // do NOT reset dia — daily KPI is independent of month navigation
  }, [])

  const handleToday = useCallback(() => {
    setMes(currentMonth)
    setAno(currentYear)
    setDia(currentDay)
  }, [currentMonth, currentYear, currentDay])

  const handleDateSelect = useCallback((date: Date | null) => {
    if (!date) {
      setDia("")
      return
    }
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
        </div>
        <p className="text-sm text-muted-foreground">Visão geral da operação Guimicell</p>
        {integrationStatus?.lastSync && (
          <p className="text-xs text-muted-foreground">
            Sincronizado às {new Date(integrationStatus.lastSync).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
        {erroFetch && !loadingKpi && (
          <Badge variant="destructive" className="mt-1">
            Erro ao carregar dados — exibindo último resultado
          </Badge>
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
            {/* 1. Faturamento do Dia (FN) — azul */}
            <KpiCard
              titulo="Faturamento do Dia"
              valor={faturamentoDiaNulo ? "Indisponível" : formatBRL(faturamentoDia)}
              descricao={faturamentoDiaNulo ? "Sem dados do backend" : dailyCardMeta.descricao}
              icone={DollarSign}
              tendencia={faturamentoDiaNulo ? "neutral" : "up"}
              accent="info"
              tooltip="Receita bruta do dia selecionado. Fonte: FoneNinja (vendas realizadas)"
            />
            {/* 2. Faturamento do Mês (FN) — azul */}
            <KpiCard
              titulo="Faturamento do Mês"
              valor={formatBRL(faturamento)}
              descricao={`${MESES[mes]} ${ano}`}
              icone={Target}
              tendencia="up"
              accent="info"
              tooltip="Receita bruta acumulada do mês. Fonte: FoneNinja"
            />
            {/* 3. Lucro Líquido Real (FN + MA) — fonte: consolidado */}
            <KpiCard
              titulo="Lucro Líquido Real"
              valor={consolidadoQuery.isLoading && !consolidado ? "…" : formatBRL(lucroLiquidoReal)}
              descricao={`Margem real ${margemReal.toFixed(1)}%`}
              icone={TrendingUp}
              tendencia={lucroLiquidoReal >= 0 ? "up" : "down"}
              accent={lucroLiquidoReal >= 0 ? "positive" : "negative"}
              destaque
              tooltip="Lucro após despesas fixas e administrativas. Fonte: consolidado contábil (MA)"
            />
            {/* 4. Total Vendas no Mês */}
            <KpiCard
              titulo="Total Vendas no Mês"
              valor={totalVendasNulo ? "Indisponível" : totalVendas > 0 ? String(totalVendas) : "—"}
              descricao={totalVendasNulo ? "Sem dados do backend" : "Vendas consolidadas"}
              icone={ShoppingCart}
              tendencia={totalVendasNulo ? "neutral" : "up"}
              tooltip="Número de vendas realizadas no mês. Fonte: FoneNinja"
            />
          </>
        )}
      </div>

      {/* ── Linha 2: KPIs executivos — Ticket · Margem · Meta · Conversão ─── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Ticket Médio */}
        <KpiCard
          titulo="Ticket Médio"
          valor={loadingKpi ? "…" : formatBRL(indicadores.ticketMedio)}
          descricao="Valor médio por venda"
          icone={Receipt}
          tooltip="Faturamento do mês ÷ número de vendas. Fonte: FoneNinja"
        />
        {/* Margem Líquida Real */}
        <KpiCard
          titulo="Margem Líquida"
          valor={consolidadoQuery.isLoading && !consolidado ? "…" : `${margemReal.toFixed(1)}%`}
          descricao="Lucro real sobre faturamento"
          icone={Percent}
          accent={margemReal >= 5 ? "positive" : margemReal > 0 ? "neutral" : "negative"}
          tooltip="Lucro líquido real ÷ faturamento × 100. Fonte: consolidado contábil (MA)"
        />
        {/* Meta Mensal de Vendas */}
        <KpiCard
          titulo="Meta Mensal"
          valor={totalVendasNulo ? "—" : `${totalVendas} / 200`}
          descricao={totalVendasNulo ? "Sem dados" : `${Math.min(Math.round((totalVendas / 200) * 100), 100)}% atingido`}
          icone={Target}
          accent={totalVendas >= 200 ? "positive" : "neutral"}
          tooltip="Progresso em relação à meta de 200 vendas no mês. Fonte: FoneNinja"
        />
        {/* Conversão de Leads */}
        <KpiCard
          titulo="Conversão"
          valor={
            comercialKPIs?.taxaConversao != null
              ? `${Number(comercialKPIs.taxaConversao).toFixed(1)}%`
              : "—"
          }
          descricao="Leads ganhos / total de leads"
          icone={BarChart2}
          accent={
            comercialKPIs?.taxaConversao != null && comercialKPIs.taxaConversao >= 10
              ? "positive"
              : "neutral"
          }
          tooltip="Taxa de conversão de leads no CRM. Fonte: Kommo / FoneNinja"
        />
      </div>

      {/* ── Linha 3: Central de Alertas ───────────────────────────────────── */}
      <PainelAlertasGlobal alerts={alertas} />

      {/* ── Linha 4: Gráficos + Origem de Leads ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Gráfico evolução faturamento/lucro */}
        <div>
          {dadosGrafico.length > 0 ? (
            <GraficoFinanceiro dados={dadosGrafico} titulo={`Lucro Médio Diário — ${MESES[mes]} ${ano}`} />
          ) : !loadingKpi ? (
            <GraficoVazio mensagem={`Sem dados para ${MESES[mes]} ${ano}`} />
          ) : (
            <Card><CardContent className="p-6"><Skeleton className="h-[240px] rounded-lg" /></CardContent></Card>
          )}
        </div>

        {/* Origem dos leads — dados reais do PostgreSQL */}
        <OrigemLeadsCard />
      </div>

      {/* ── Linha 5: Ranking + Tarefas lado a lado ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VendedoresRanking entries={rankingEntries} loading={rankingLoading} />
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
      </div>

    </div>
  )
}
