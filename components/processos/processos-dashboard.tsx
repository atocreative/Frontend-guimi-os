"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  DollarSign, TrendingUp, TrendingDown, Wallet,
  AlertTriangle, CheckCircle2, ArrowUpRight, RefreshCw,
  CreditCard, Repeat, CalendarClock, Clock,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { GlobalDateFilter } from "@/components/global/global-date-filter"
import { TabelaDespesas } from "@/components/financeiro/tabela-despesas"
import { TabelaEntradas } from "@/components/financeiro/tabela-entradas"
import { getDashboardSummary } from "@/lib/services/dashboard-summary"
import { getPeriodoLabel } from "@/lib/financeiro-utils"
import type { DashboardSummary } from "@/lib/types/dashboard"
import type { DespesaItem } from "@/components/financeiro/tabela-despesas"
import type { VendaRecente } from "@/components/financeiro/tabela-entradas"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MESES_ABBR = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

function toNum(v: unknown): number {
  const n = Number(v)
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

function brlCompact(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNum(valor))
}

function mesAnterior(mes: number, ano: number) {
  return mes === 0 ? { mes: 11, ano: ano - 1 } : { mes: mes - 1, ano }
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

function agruparDespesasPorCategoria(despesas: DespesaItem[]) {
  const grupos: Record<string, number> = {}
  for (const d of despesas) {
    const cat = String((d as any).categoria ?? (d as any).category ?? "Outros")
    const val = toNum((d as any).valor ?? (d as any).value ?? (d as any).totalCusto ?? (d as any).amount ?? 0)
    grupos[cat] = (grupos[cat] ?? 0) + val
  }
  const total = Object.values(grupos).reduce((a, b) => a + b, 0)
  return Object.entries(grupos)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([categoria, valor], i) => ({
      categoria,
      valor,
      percentual: total > 0 ? (valor / total) * 100 : 0,
      cor: PIE_CORES[i % PIE_CORES.length],
    }))
}

const PIE_CORES = [
  "#6366f1", "#f97316", "#10b981", "#f59e0b",
  "#3b82f6", "#ec4899", "#64748b", "#8b5cf6",
]

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface HistoricoMes {
  label: string
  receitas: number
  despesas: number
  saldo: number
}

interface OperacionalKpis {
  atrasadas: number | null
  parceladas: number | null
  recorrentes: number | null
  compromissosHoje: number | null
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialSummary: DashboardSummary | null
  initialMes: number
  initialAno: number
  availableYears: number[]
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ProcessosDashboard({
  initialSummary,
  initialMes,
  initialAno,
  availableYears,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const today = new Date()
  const mesAtual = initialMes
  const anoAtual = initialAno

  const [mes, setMes] = useState(() => {
    const raw = searchParams.get("m")
    const m = raw !== null ? Number(raw) : NaN
    return !isNaN(m) && m >= 0 && m <= 11 ? m : initialMes
  })
  const [ano, setAno] = useState(() => {
    const y = Number(searchParams.get("y"))
    return y >= 2024 ? y : initialAno
  })
  const [dia, setDia] = useState<number | null>(() => {
    const d = Number(searchParams.get("d"))
    return d >= 1 && d <= 31 ? d : null
  })

  const [summary, setSummary]         = useState<DashboardSummary | null>(initialSummary)
  const [despesas, setDespesas]       = useState<DespesaItem[]>([])
  const [entradas, setEntradas]       = useState<VendaRecente[]>([])
  const [historico, setHistorico]     = useState<HistoricoMes[]>([])
  const [operacional, setOperacional] = useState<OperacionalKpis>({
    atrasadas: null, parceladas: null, recorrentes: null, compromissosHoje: null,
  })
  const [loading, setLoading]         = useState(false)
  const [erro, setErro]               = useState(false)

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams()
    params.set("m", String(mes))
    params.set("y", String(ano))
    if (dia) params.set("d", String(dia))
    router.replace(`/processos?${params.toString()}`, { scroll: false })
  }, [mes, ano, dia, router])

  const maxMes = ano === anoAtual ? mesAtual : 11
  const mesEfetivo = Math.min(mes, maxMes)

  // Fetch histórico dos últimos 5 meses
  const fetchHistorico = useCallback(async (currentMes: number, currentAno: number) => {
    const meses: { mes: number; ano: number }[] = []
    let m = currentMes, a = currentAno
    for (let i = 0; i < 5; i++) {
      meses.unshift({ mes: m, ano: a })
      const prev = mesAnterior(m, a)
      m = prev.mes; a = prev.ano
    }
    const results = await Promise.all(
      meses.map(({ mes: mm, ano: aa }) =>
        getDashboardSummary({ year: aa, month: mm }).catch(() => null)
      )
    )
    setHistorico(
      meses.map(({ mes: mm, ano: aa }, i) => {
        const s = results[i]
        const receitas  = toNum(s?.faturamentoMes ?? s?.financeiro?.receita)
        const despesasV = toNum(s?.despesasMes    ?? s?.financeiro?.despesasVariaveis)
        return {
          label: `${MESES_ABBR[mm]}/${String(aa).slice(2)}`,
          receitas,
          despesas: despesasV,
          saldo: receitas - despesasV,
        }
      })
    )
  }, [])

  // Fetch operacional (overview)
  const fetchOperacional = useCallback(async (m: number, a: number, d: number | null) => {
    const { startDate, endDate } = gerarPeriodo(m, a, d)
    const params = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    try {
      const res = await fetch(`/api/financeiro/overview?${params}`)
      if (!res.ok) return
      const data = await res.json().catch(() => null)
      if (!data?.resumo) return
      const r = data.resumo
      setOperacional({
        atrasadas:        r.contasAtrasadas  ?? r.atrasadas  ?? null,
        parceladas:       r.parceladas       ?? null,
        recorrentes:      r.recorrentes      ?? null,
        compromissosHoje: r.compromissosHoje ?? r.compromissos_hoje ?? null,
      })
    } catch { /* silent */ }
  }, [])

  const fetchAll = useCallback(async (m: number, a: number, d: number | null) => {
    setLoading(true)
    setErro(false)
    const { startDate, endDate } = gerarPeriodo(m, a, d)
    const params = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    type ComprasRes = { data?: DespesaItem[] }
    type VendasRes  = { data?: VendaRecente[] }

    const [atual, despesasRes, entradasRes] = await Promise.all([
      getDashboardSummary({ year: a, month: m, ...(d ? { day: d } : {}) }),
      fetch(`/api/financeiro/compras/recentes?${params}`)
        .then((r) => r.ok ? r.json() as Promise<ComprasRes> : ({} as ComprasRes))
        .catch(() => ({} as ComprasRes)),
      fetch(`/api/financeiro/vendas/recentes?${params}`)
        .then((r) => r.ok ? r.json() as Promise<VendasRes> : ({} as VendasRes))
        .catch(() => ({} as VendasRes)),
    ])

    if (!atual) setErro(true)
    setSummary(atual)
    setDespesas(Array.isArray(despesasRes?.data) ? despesasRes.data : [])
    setEntradas(Array.isArray(entradasRes?.data) ? entradasRes.data : [])
    setLoading(false)

    // Histórico e operacional em background (não bloqueiam o render principal)
    fetchHistorico(m, a)
    fetchOperacional(m, a, d)
  }, [fetchHistorico, fetchOperacional])

  useEffect(() => {
    fetchAll(mesEfetivo, ano, dia)
  }, [mesEfetivo, ano, dia, fetchAll])

  // Handlers filtro
  const handleMonthChange = useCallback((m: number, y: number) => { setMes(m); setAno(y); setDia(null) }, [])
  const handleToday       = useCallback(() => {
    const now = new Date()
    setMes(now.getMonth()); setAno(now.getFullYear()); setDia(now.getDate())
  }, [])
  const handleDateSelect  = useCallback((date: Date | null) => {
    if (!date) { setDia(null); return }
    setMes(date.getMonth()); setAno(date.getFullYear()); setDia(date.getDate())
  }, [])

  // ── KPIs ──
  const receitas   = toNum(summary?.faturamentoMes  ?? summary?.financeiro?.receita)
  const despesasV  = toNum(summary?.despesasMes     ?? summary?.financeiro?.despesasVariaveis)
  const saldo      = receitas - despesasV
  const fluxo      = toNum(summary?.lucroLiquidoMes ?? summary?.financeiro?.netProfit)
  const margemBruta  = toNum(summary?.margemBruta)
  const margemLiq    = toNum(summary?.margemLiquida)
  const totalVendas  = toNum(summary?.totalVendas)
  const ticketMedio  = toNum(summary?.ticketMedio)

  // ── Categorias despesas ──
  const categorias = useMemo(() => agruparDespesasPorCategoria(despesas), [despesas])

  // ── Alertas ──
  const alertas = useMemo(() => {
    const list: Array<{ tipo: "warning" | "success" | "info"; mensagem: string }> = []
    if (saldo < 0)
      list.push({ tipo: "warning", mensagem: `Saldo negativo no período: ${brl(saldo)}` })
    if (margemLiq < 5 && receitas > 0)
      list.push({ tipo: "warning", mensagem: `Margem líquida baixa: ${margemLiq.toFixed(1)}%` })
    if (despesasV > receitas * 0.9 && receitas > 0)
      list.push({ tipo: "warning", mensagem: `Despesas representam ${((despesasV / receitas) * 100).toFixed(0)}% da receita` })
    if (operacional.atrasadas && operacional.atrasadas > 0)
      list.push({ tipo: "warning", mensagem: `${operacional.atrasadas} conta(s) em atraso` })
    if (saldo > 0 && margemLiq >= 10)
      list.push({ tipo: "success", mensagem: `Fluxo positivo com margem líquida de ${margemLiq.toFixed(1)}%` })
    return list.slice(0, 4)
  }, [saldo, margemLiq, despesasV, receitas, operacional.atrasadas])

  // ── Label ──
  const periodoLabel = getPeriodoLabel({
    dia, mes: mesEfetivo, ano,
    mesAtual: today.getMonth(), anoAtual: today.getFullYear(),
  })

  const selectedDate = dia ? new Date(ano, mesEfetivo, dia) : null
  const isMesAtual   = mesEfetivo === today.getMonth() && ano === today.getFullYear()

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-semibold">Processos</h2>
        <p className="text-sm text-muted-foreground">
          {periodoLabel}
          {loading && <span className="ml-2 text-xs text-muted-foreground/60">atualizando…</span>}
        </p>
      </div>

      {/* ── Filtro ── */}
      <GlobalDateFilter
        month={mesEfetivo}
        year={ano}
        selectedDate={selectedDate}
        maxDate={new Date(anoAtual, mesAtual, today.getDate())}
        onMonthChange={handleMonthChange}
        onToday={handleToday}
        onDateSelect={handleDateSelect}
      />

      {/* ── Loading badge ── */}
      {loading && (
        <div className="flex">
          <Badge variant="outline" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Carregando
          </Badge>
        </div>
      )}

      {/* ── Erros ── */}
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

      {/* ── Row 1 — KPIs Financeiros ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Saldo do Período"
          valor={brl(saldo)}
          descricao={saldo >= 0 ? "Resultado positivo" : "Resultado negativo"}
          icone={saldo >= 0 ? TrendingUp : TrendingDown}
          tendencia={saldo >= 0 ? "up" : "down"}
          destaque
        />
        <KpiCard
          titulo="Receitas"
          valor={brl(receitas)}
          descricao={`${totalVendas} venda${totalVendas !== 1 ? "s" : ""}`}
          icone={DollarSign}
          tendencia={receitas > 0 ? "up" : "neutral"}
        />
        <KpiCard
          titulo="Despesas"
          valor={brl(despesasV)}
          descricao={`${((despesasV / (receitas || 1)) * 100).toFixed(1)}% da receita`}
          icone={TrendingDown}
          tendencia="down"
        />
        <KpiCard
          titulo="Fluxo de Caixa"
          valor={brl(fluxo)}
          descricao={`Margem ${margemLiq.toFixed(1)}%`}
          icone={Wallet}
          tendencia={fluxo >= 0 ? "up" : "down"}
        />
      </div>

      {/* ── Row 2 — KPIs Operacionais ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Contas Atrasadas
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {operacional.atrasadas !== null ? operacional.atrasadas : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {operacional.atrasadas === null ? "N/D neste período" : operacional.atrasadas === 0 ? "Nenhuma em atraso" : "Requer atenção"}
                </p>
              </div>
              <div className="rounded-lg p-2 bg-muted">
                <AlertTriangle className={`h-4 w-4 ${operacional.atrasadas ? "text-amber-500" : "text-muted-foreground"}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Parceladas
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {operacional.parceladas !== null ? operacional.parceladas : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {operacional.parceladas === null ? "N/D neste período" : "Transações parceladas"}
                </p>
              </div>
              <div className="rounded-lg p-2 bg-muted">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recorrentes
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {operacional.recorrentes !== null ? operacional.recorrentes : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {operacional.recorrentes === null ? "N/D neste período" : "Cobranças recorrentes"}
                </p>
              </div>
              <div className="rounded-lg p-2 bg-muted">
                <Repeat className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Compromissos Hoje
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {operacional.compromissosHoje !== null ? operacional.compromissosHoje : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {!isMesAtual ? "Selecione mês atual" : operacional.compromissosHoje === null ? "N/D" : "Para hoje"}
                </p>
              </div>
              <div className="rounded-lg p-2 bg-muted">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3 — Gráficos ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Line chart — histórico 5 meses */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Histórico — Receitas, Despesas e Saldo
            </CardTitle>
            <p className="text-xs text-muted-foreground">Últimos 5 meses</p>
          </CardHeader>
          <CardContent>
            {historico.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center">
                <div className="h-3 w-48 rounded bg-muted animate-pulse" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={historico} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={brlCompact}
                    width={56}
                  />
                  <RechartsTooltip
                    formatter={(v) => brl(Number(v))}
                    contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="receitas"
                    name="Receitas"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    name="Despesas"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie chart — despesas por categoria */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categorias.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {loading ? "Carregando…" : "Sem dados"}
                </p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={categorias}
                      dataKey="valor"
                      nameKey="categoria"
                      cx="50%"
                      cy="50%"
                      outerRadius={64}
                      innerRadius={28}
                      label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                      labelLine={false}
                    >
                      {categorias.map((d, i) => (
                        <Cell key={i} fill={d.cor} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(v) => brl(Number(v))}
                      contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {categorias.map((item) => (
                    <div key={item.categoria} className="flex items-center justify-between text-xs gap-2">
                      <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                        <span
                          className="inline-block h-2 w-2 rounded-full shrink-0"
                          style={{ background: item.cor }}
                        />
                        <span className="truncate">{item.categoria}</span>
                        <span className="text-muted-foreground/60 shrink-0">
                          {item.percentual.toFixed(0)}%
                        </span>
                      </span>
                      <span className="font-medium tabular-nums shrink-0">{brl(item.valor)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Alertas ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alertas Financeiros
            {isMesAtual && dia === null && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {MESES[mesEfetivo]} {ano}
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
              const Icon = a.tipo === "success" ? CheckCircle2 : a.tipo === "warning" ? AlertTriangle : ArrowUpRight
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

      {/* ── Row 4 — Tabelas ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TabelaDespesas despesas={despesas} loading={loading} />
        <TabelaEntradas entradas={entradas} />
      </div>

      {/* ── KPIs adicionais ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Margem Bruta"
          valor={`${margemBruta.toFixed(1)}%`}
          descricao="Receita - COGS"
          icone={TrendingUp}
          tendencia={margemBruta >= 20 ? "up" : margemBruta >= 10 ? "neutral" : "down"}
        />
        <KpiCard
          titulo="Margem Líquida"
          valor={`${margemLiq.toFixed(1)}%`}
          descricao="Após despesas fixas"
          icone={TrendingUp}
          tendencia={margemLiq >= 10 ? "up" : margemLiq >= 5 ? "neutral" : "down"}
        />
        <KpiCard
          titulo="Total Vendas"
          valor={String(totalVendas)}
          descricao="Transações no período"
          icone={Clock}
          tendencia={totalVendas > 0 ? "up" : "neutral"}
        />
        <KpiCard
          titulo="Ticket Médio"
          valor={brl(ticketMedio)}
          descricao="Por venda"
          icone={DollarSign}
          tendencia={ticketMedio > 0 ? "up" : "neutral"}
        />
      </div>

    </div>
  )
}
