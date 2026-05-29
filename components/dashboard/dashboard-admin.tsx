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
import type { TarefaDB } from "@/types/tarefas"
import { getDailyCardMeta } from "@/lib/financeiro-utils"
import { api } from "@/lib/api-client"
import { sortTarefasByPriority } from "@/lib/tarefas"

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

  // Local tarefas state — initialized from server props, refreshed client-side on mount
  const [tarefasPendentesLive, setTarefasPendentesLive] = useState<TarefaDB[]>(tarefasPendentes)
  useEffect(() => {
    api.getTasks().then(({ tasks }) => {
      const now = new Date()
      const pending = sortTarefasByPriority(
        tasks.filter((t) => t.status === "PENDENTE" || t.status === "EM_ANDAMENTO"),
        now
      )
      setTarefasPendentesLive(pending)
    }).catch(() => {
      // keep server-rendered data on error
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())
  const { notifyTaskCompleted, notifyTaskCompletionError } = useGamificacaoFeedback()
  const { status: integrationStatus, refetch: refetchIntegrationStatus } = useIntegrationStatus()
  const { entries: rankingEntries, loading: rankingLoading } = useDashboardRanking({ mes, ano })
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
      }
      // se null, mantém dados anteriores — não zera tudo
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
      setErroFetch(true)
      // mantém dados anteriores visíveis
    } finally {
      setLoadingKpi(false)
    }
  }, [])

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
    try {
      const s = await getDashboardSummary({ year: a, month: m + 1, day: d })
      setFaturamentoDiaSelecionado(s ? toNum(s.faturamentoDia) : null)
      setLucroLiquidoDiaSelecionado(s?.lucroLiquidoDia ?? null)
    } catch {
      setFaturamentoDiaSelecionado(null)
      setLucroLiquidoDiaSelecionado(null)
    }
  }, [])

  useEffect(() => { fetchMensal(mes, ano) }, [mes, ano, fetchMensal])
  useEffect(() => { fetchHoje() }, [fetchHoje])
  useEffect(() => { fetchDiario(mes, ano, diaValido === "" ? "" : diaValido) }, [mes, ano, diaValido, fetchDiario])

  // ── Consolidado financeiro (source of truth — mesmos bindings do Financeiro) ──
  const consolidadoQuery = useFinanceiroConsolidado(ano, mes + 1)
  const consolidado = consolidadoQuery.data
  const lucroLiquidoReal = toNum(consolidado?.realCompanyProfit)
  const margemReal = toNum(consolidado?.realMargin)
  const adminExpenses = toNum(consolidado?.administrativeExpenses)
  const fixedExpenses = toNum(consolidado?.fixedExpenses)
  const burnRate = adminExpenses + fixedExpenses
  // grossProfitCanonical computed after faturamento is available (see below)

  // ── auto-refresh integration status após cada atualização de dados ──────────
  useEffect(() => {
    const timer = setTimeout(() => refetchIntegrationStatus(), 500)
    return () => clearTimeout(timer)
  }, [indicadores, refetchIntegrationStatus])

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
  const alertas = useMemo(
    () =>
      getDashboardAlerts({
        role: "ADMIN",
        integrationStatus,
        faturamentoDia,
        loadingKpi,
        tarefasPendentes: tarefasPendentesLive,
        margemBruta: margemBrutaEffective,
        margemReal,
        burnRate,
        lucroLiquidoReal,
        adminExpenses,
        faturamentoMes: indicadores.faturamento,
        isHoje: diaValido === "" && mes === currentMonth && ano === currentYear,
      }),
    [
      integrationStatus, faturamentoDia, loadingKpi, tarefasPendentesLive, margemBrutaEffective,
      margemReal, burnRate, lucroLiquidoReal, adminExpenses,
      indicadores.faturamento, diaValido, mes, ano, currentMonth, currentYear,
    ]
  )

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
    () => new Map([...tarefasHoje, ...tarefasPendentesLive].map((t) => [t.id, t])),
    [tarefasHoje, tarefasPendentesLive]
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
    () => tarefasPendentesLive.filter((t) => !concluidos.has(t.id)),
    [tarefasPendentesLive, concluidos]
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
            />
            {/* 2. Faturamento do Mês (FN) — azul */}
            <KpiCard
              titulo="Faturamento do Mês"
              valor={formatBRL(faturamento)}
              descricao={`${MESES[mes]} ${ano}`}
              icone={Target}
              tendencia="up"
              accent="info"
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
            />
            {/* 4. Total Vendas no Mês */}
            <KpiCard
              titulo="Total Vendas no Mês"
              valor={totalVendasNulo ? "Indisponível" : totalVendas > 0 ? String(totalVendas) : "—"}
              descricao={totalVendasNulo ? "Sem dados do backend" : "Vendas consolidadas"}
              icone={ShoppingCart}
              tendencia={totalVendasNulo ? "neutral" : "up"}
            />
          </>
        )}
      </div>

      {/* ── Linha 2: Alertas do Sistema — full width ───────────────────────── */}
      <PainelAlertasGlobal alerts={alertas} />

      {/* ── Linha 3: 2 Gráficos lado a lado ───────────────────────────────── */}
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

      {/* ── Linha 4: Ranking + Tarefas lado a lado ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VendedoresRanking entries={rankingEntries} loading={rankingLoading} />
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
      </div>

    </div>
  )
}
