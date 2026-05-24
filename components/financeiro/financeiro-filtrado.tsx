"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Receipt,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  PercentCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { TabelaDespesas } from "@/components/financeiro/tabela-despesas"
import { TabelaEntradas } from "@/components/financeiro/tabela-entradas"
import { Badge } from "@/components/ui/badge"
import { GlobalDateFilter } from "@/components/global/global-date-filter"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { DashboardSummary } from "@/lib/types/dashboard"
import { getDashboardSummary } from "@/lib/services/dashboard-summary"
import type { DespesaItem } from "@/components/financeiro/tabela-despesas"
import type { VendaRecente } from "@/components/financeiro/tabela-entradas"
import { calcularAlertasFinanceiros, calcularScale } from "@/lib/services/financial-alerts"
import type { AlertaFinanceiro } from "@/lib/services/financial-alerts"
import { getPeriodoLabel, getDailyCardMeta } from "@/lib/financeiro-utils"

// ─── Constantes ──────────────────────────────────────────────────────────────

const META_MES_VENDAS = 200

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const DESPESAS_CORES: Record<string, string> = {
  "Meu Assessor": "#6366f1",
  "Fone Ninja":   "#f97316",
  "Outros":       "#64748b",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNum(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNum(valor))
}

function gerarPeriodo(mes: number, ano: number, dia?: number | null) {
  if (dia) {
    const start = new Date(Date.UTC(ano, mes, dia))
    const end   = new Date(Date.UTC(ano, mes, dia, 23, 59, 59, 999))
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }
  const start = new Date(Date.UTC(ano, mes, 1))
  const end   = new Date(Date.UTC(ano, mes + 1, 1) - 1)
  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

function mesAnterior(mes: number, ano: number) {
  return mes === 0 ? { mes: 11, ano: ano - 1 } : { mes: mes - 1, ano }
}

function diasNoMes(mes: number, ano: number) {
  return new Date(ano, mes + 1, 0).getDate()
}

// ─── Lógica de despesas por categoria ────────────────────────────────────────

function agruparDespesasPorCategoria(despesas: DespesaItem[]) {
  const grupos: Record<string, number> = {}
  for (const d of despesas) {
    const cat = String(d.categoria ?? d.category ?? "Outros")
    const val = toNum(d.valor ?? d.value ?? d.amount)
    grupos[cat] = (grupos[cat] ?? 0) + val
  }
  return Object.entries(grupos)
    .filter(([, v]) => v > 0)
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      cor: DESPESAS_CORES[categoria] ?? DESPESAS_CORES["Outros"],
    }))
}

// ─── Alertas — usa engine compartilhada de lib/services/financial-alerts ─────

type AlertaTipo = "warning" | "success" | "info"
// Alias local para compatibilidade com o JSX existente
type Alerta = Pick<AlertaFinanceiro, "tipo" | "mensagem">

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialSummary: DashboardSummary | null
  initialMes: number
  initialAno: number
  initialSummaryAnterior?: DashboardSummary | null
  availableYears: number[]
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FinanceiroFiltrado({
  initialSummary,
  initialMes,
  initialAno,
  initialSummaryAnterior = null,
  availableYears,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mesAtual = initialMes
  const anoAtual = initialAno

  // Seed from query params if present
  // NOTE: Number(null)===0 which passes >=0 check — must guard with null check first
  const [mes, setMes]                         = useState(() => {
    const raw = searchParams.get("m")
    const m = raw !== null ? Number(raw) : NaN
    return !isNaN(m) && m >= 0 && m <= 11 ? m : initialMes
  })
  const [ano, setAno]                         = useState(() => {
    const y = Number(searchParams.get("y"))
    return y >= 2024 ? y : initialAno
  })
  const [dia, setDia]                         = useState<number | null>(() => {
    const d = Number(searchParams.get("d"))
    return d >= 1 && d <= 31 ? d : null
  })
  const [summary, setSummary]                 = useState<DashboardSummary | null>(initialSummary)
  const [summaryAnterior, setSummaryAnterior] = useState<DashboardSummary | null>(initialSummaryAnterior)
  const [despesas, setDespesas]               = useState<DespesaItem[]>([])
  const [entradas, setEntradas]               = useState<VendaRecente[]>([])
  const [loading, setLoading]                 = useState(false)
  const [erro, setErro]                       = useState(false)

  // Sync filter state to URL query params (shallow replace, no navigation)
  useEffect(() => {
    const params = new URLSearchParams()
    params.set("m", String(mes))
    params.set("y", String(ano))
    if (dia) params.set("d", String(dia))
    router.replace(`/financeiro?${params.toString()}`, { scroll: false })
  }, [mes, ano, dia, router])

  // Limita meses futuros
  const maxMes = ano === anoAtual ? mesAtual : 11
  const mesEfetivo = Math.min(mes, maxMes)

  const isInicial = mesEfetivo === initialMes && ano === initialAno && !dia

  const fetchAmbos = useCallback(async (m: number, a: number, d: number | null) => {
    setLoading(true)
    setErro(false)
    const ant = mesAnterior(m, a)
    const { startDate, endDate } = gerarPeriodo(m, a, d)
    const params = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    type ComprasRes = { data?: DespesaItem[] }
    type VendasRes  = { data?: VendaRecente[] }

    const [atual, anterior, despesasRes, entradasRes] = await Promise.all([
      getDashboardSummary({ year: a, month: m, ...(d ? { day: d } : {}) }),
      d ? Promise.resolve(null) : getDashboardSummary({ year: ant.ano, month: ant.mes }),
      fetch(`/api/financeiro/compras/recentes?${params}`)
        .then((r) => r.ok ? r.json() as Promise<ComprasRes> : ({} as ComprasRes))
        .catch(() => ({} as ComprasRes)),
      fetch(`/api/financeiro/vendas/recentes?${params}`)
        .then((r) => r.ok ? r.json() as Promise<VendasRes> : ({} as VendasRes))
        .catch(() => ({} as VendasRes)),
    ])

    if (!atual) setErro(true)
    setSummary(atual)
    setSummaryAnterior(anterior)
    setDespesas(Array.isArray(despesasRes?.data) ? despesasRes.data : [])
    setEntradas(Array.isArray(entradasRes?.data) ? entradasRes.data : [])
    setLoading(false)
  }, [])

  // Fetch tables on every period change — including the initial load (compras/vendas are not SSR)
  useEffect(() => {
    fetchAmbos(mesEfetivo, ano, dia)
  }, [mesEfetivo, ano, dia, fetchAmbos])

  // ── GlobalDateFilter handlers ──
  const handleMonthChange = useCallback((m: number, y: number) => { setMes(m); setAno(y); setDia(null) }, [])
  const handleToday = useCallback(() => {
    const now = new Date()
    setMes(now.getMonth())
    setAno(now.getFullYear())
    setDia(now.getDate())
  }, [])
  const handleDateSelect = useCallback((date: Date | null) => {
    if (!date) { setDia(null); return }
    setMes(date.getMonth())
    setAno(date.getFullYear())
    setDia(date.getDate())
  }, [])

  const today = new Date()

  // ── KPIs ──
  const faturamento       = toNum(summary?.faturamentoMes   ?? summary?.financeiro?.receita)
  const fatDia            = toNum(summary?.faturamentoDia)
  const dailyCardMeta     = getDailyCardMeta({
    dia,
    mes: mesEfetivo,
    ano,
    mesAtual: today.getMonth(),
    anoAtual: today.getFullYear(),
    diaAtual: today.getDate(),
    lucroLiquidoDia: summary?.lucroLiquidoDia ?? null,
  })
  const lucroOperacional  = toNum(summary?.lucroOperacionalMes ?? summary?.financeiro?.grossProfit)
  const lucro             = toNum(summary?.lucroLiquidoMes  ?? summary?.financeiro?.netProfit)
  const totalDesp         = toNum(summary?.despesasMes      ?? summary?.financeiro?.despesasVariaveis)
  const totalVendas       = toNum(summary?.totalVendas)
  const ticketMedio       = toNum(summary?.ticketMedio)
  // Prefer backend-computed margins; fall back to local calculation
  const margemBruta   = toNum(summary?.margemBruta   ?? (faturamento > 0 ? (lucroOperacional / faturamento) * 100 : 0))
  const margemLiquida = toNum(summary?.margemLiquida ?? (faturamento > 0 ? (lucro            / faturamento) * 100 : 0))
  const margem        = margemLiquida  // alias kept for internal use

  const fatAnt = toNum(summaryAnterior?.faturamentoMes ?? summaryAnterior?.financeiro?.receita)
  const crescimento = fatAnt > 0 ? ((faturamento - fatAnt) / fatAnt) * 100 : null
  const crescLabel = crescimento === null
    ? "Sem dados anteriores"
    : crescimento >= 0
      ? `↑ ${crescimento.toFixed(1)}% vs ${MESES[mesAnterior(mesEfetivo, ano).mes]}`
      : `↓ ${Math.abs(crescimento).toFixed(1)}% vs ${MESES[mesAnterior(mesEfetivo, ano).mes]}`

  // Meta vendas
  const pctVendas   = META_MES_VENDAS > 0 ? Math.min((totalVendas / META_MES_VENDAS) * 100, 100) : 0
  const faltamVend  = Math.max(0, META_MES_VENDAS - totalVendas)

  // Dados gráficos
  const categoriasDespesas = agruparDespesasPorCategoria(despesas)

  // Contexto de período para alertas
  const isMesAtual = mesEfetivo === today.getMonth() && ano === today.getFullYear()
  const diaAtual = isMesAtual ? today.getDate() : null
  const { mes: prevMesN, ano: prevAnoN } = mesAnterior(mesEfetivo, ano)
  const diasPrevMes = diasNoMes(prevMesN, prevAnoN)
  const scale = calcularScale(isMesAtual, diaAtual, diasPrevMes)

  // Alertas (memoizado) — engine proporcional compartilhada
  const alertas = useMemo((): Alerta[] => {
    const s  = (v: unknown) => toNum(v) * scale
    return calcularAlertasFinanceiros({
      fat:          toNum(summary?.faturamentoMes   ?? summary?.financeiro?.receita),
      fatAnt:       s(summaryAnterior?.faturamentoMes ?? summaryAnterior?.financeiro?.receita),
      lucro:        toNum(summary?.lucroLiquidoMes  ?? summary?.financeiro?.netProfit),
      lucroAnt:     s(summaryAnterior?.lucroLiquidoMes ?? summaryAnterior?.financeiro?.netProfit),
      margem:       toNum(summary?.margemLiquida),
      margemAnt:    toNum(summaryAnterior?.margemLiquida),
      margemBruta:  toNum(summary?.margemBruta),
      margemBrutaAnt: toNum(summaryAnterior?.margemBruta),
      desp:         toNum(summary?.despesasMes      ?? summary?.financeiro?.despesasVariaveis),
      despAnt:      s(summaryAnterior?.despesasMes  ?? summaryAnterior?.financeiro?.despesasVariaveis),
      vendas:       toNum(summary?.totalVendas),
      vendasAnt:    s(summaryAnterior?.totalVendas),
      ticket:       toNum(summary?.ticketMedio),
      ticketAnt:    toNum(summaryAnterior?.ticketMedio), // sem escala — é por venda
      metaVendas:   META_MES_VENDAS,
      isMesAtual,
      diaAtual,
    }, 4)
  }, [summary, summaryAnterior, isMesAtual, diaAtual, scale])

  // Label do período — fonte única (getPeriodoLabel)
  const periodoLabel = getPeriodoLabel({
    dia,
    mes: mesEfetivo,
    ano,
    mesAtual: today.getMonth(),
    anoAtual: today.getFullYear(),
  })

  const now = new Date()
  const selectedDate = dia ? new Date(ano, mesEfetivo, dia) : null

  return (
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold">Financeiro</h2>
        <p className="text-sm text-muted-foreground">
          {periodoLabel}
          {loading && <span className="ml-2 text-xs text-muted-foreground/60">atualizando…</span>}
        </p>
      </div>

      {/* ── Filtro de período ─────────────────────────────────────────── */}
      <GlobalDateFilter
        month={mesEfetivo}
        year={ano}
        selectedDate={selectedDate}
        maxDate={new Date(anoAtual, mesAtual, now.getDate())}
        onMonthChange={handleMonthChange}
        onToday={handleToday}
        onDateSelect={handleDateSelect}
      />

      {/* ── Status badges ────────────────────────────────────────────── */}
      {loading && (
        <div className="flex">
          <Badge variant="outline" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Carregando
          </Badge>
        </div>
      )}

      {/* ── Avisos ───────────────────────────────────────────────────── */}
      {erro && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <CardContent className="px-4 py-3 text-sm text-red-800 dark:text-red-400">
            Não foi possível carregar dados para este período.
          </CardContent>
        </Card>
      )}
      {!loading && !erro && !summary && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
          <CardContent className="px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
            Nenhum dado disponível para {periodoLabel}.
          </CardContent>
        </Card>
      )}

      {/* ── KPIs Linha 1 — 4 cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Faturamento do Dia"
          valor={brl(fatDia)}
          descricao={dailyCardMeta.descricao}
          icone={DollarSign}
          tendencia={fatDia > 0 ? "up" : "neutral"}
        />
        <KpiCard
          titulo="Faturamento do Mês"
          valor={brl(faturamento)}
          descricao={crescLabel}
          icone={TrendingUp}
          tendencia={crescimento === null ? "neutral" : crescimento >= 0 ? "up" : "down"}
          destaque
        />
        <KpiCard
          titulo="Lucro Líquido"
          valor={brl(lucro)}
          descricao={`Bruta ${margemBruta.toFixed(1)}% · Líquida ${margemLiquida.toFixed(1)}%`}
          icone={Wallet}
          tendencia={lucro > 0 ? "up" : "down"}
        />
        <KpiCard
          titulo="Total Despesas"
          valor={brl(totalDesp)}
          descricao={`COGS + despesas fixas`}
          icone={Receipt}
          tendencia="down"
        />
      </div>

      {/* ── KPIs Linha 2 — 2 cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Meta produtos — card expandido com progresso */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Meta — Produtos Vendidos
              </p>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {totalVendas}
              <span className="text-base font-normal text-muted-foreground"> / {META_MES_VENDAS}</span>
            </p>
            <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${pctVendas >= 100 ? "bg-emerald-500" : pctVendas >= 70 ? "bg-blue-500" : "bg-amber-500"}`}
                style={{ width: `${pctVendas}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{pctVendas.toFixed(0)}% da meta</span>
              {faltamVend === 0
                ? <span className="text-emerald-600 font-medium">meta atingida ✓</span>
                : isMesAtual
                  ? <span>faltam <strong className="text-foreground">{faltamVend}</strong></span>
                  : <span className="text-red-500">faltaram <strong>{faltamVend}</strong></span>
              }
            </div>
          </CardContent>
        </Card>

        <KpiCard
          titulo="Ticket Médio"
          valor={brl(ticketMedio)}
          descricao="Por venda"
          icone={PercentCircle}
          tendencia={ticketMedio > 0 ? "up" : "neutral"}
        />
      </div>

      {/* ── Alertas Financeiros ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alertas Financeiros
            {isMesAtual && diaAtual && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                comparando primeiros {diaAtual} dias de cada mês
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {alertas.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground w-full">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              Nenhum desvio relevante no período.
            </div>
          ) : (
            alertas.map((a, i) => {
              const Icon = a.tipo === "success" ? CheckCircle2
                : a.tipo === "warning" ? AlertTriangle
                : ArrowUpRight
              return (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs leading-snug flex-1 min-w-[200px] ${
                    a.tipo === "success"
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : a.tipo === "warning"
                      ? "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                      : "bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{a.mensagem}</span>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* ── Despesas por categoria ────────────────────────────────────── */}
      {categoriasDespesas.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoriasDespesas}
                  dataKey="valor"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  innerRadius={30}
                  label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                  labelLine={false}
                >
                  {categoriasDespesas.map((d, i) => (
                    <Cell key={i} fill={d.cor} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => brl(Number(v))}
                  contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center gap-2 min-w-[160px]">
              {categoriasDespesas.map((item) => (
                <div key={item.categoria} className="flex items-center justify-between text-xs gap-4">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: item.cor }} />
                    {item.categoria}
                  </span>
                  <span className="font-medium tabular-nums">{brl(item.valor)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tabelas ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TabelaDespesas despesas={despesas} loading={loading} />
        <TabelaEntradas entradas={entradas} />
      </div>

    </div>
  )
}
