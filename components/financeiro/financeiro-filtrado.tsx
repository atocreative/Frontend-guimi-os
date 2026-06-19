"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  TrendingUp, Wallet, ShoppingBag, Package,
  AlertTriangle, CheckCircle2, ArrowUpRight,
  AlertCircle, Calendar, DollarSign, Flame, Sparkles, Info,
} from "lucide-react"
import {
  Tooltip as UiTooltip,
  TooltipContent as UiTooltipContent,
  TooltipProvider as UiTooltipProvider,
  TooltipTrigger as UiTooltipTrigger,
} from "@/components/ui/tooltip"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TabelaDespesas } from "@/components/financeiro/tabela-despesas"
import { TabelaEntradas } from "@/components/financeiro/tabela-entradas"
import { GlobalDateFilter } from "@/components/global/global-date-filter"
import { useFinancialConsolidated } from "@/lib/queries/use-financial-consolidated"
import { useFinancialMonthly } from "@/lib/queries/use-financial-monthly"
import { useFinancialDaily } from "@/lib/queries/use-financial-daily"
import type { DashboardSummary } from "@/lib/types/dashboard"
import type { DespesaItem } from "@/components/financeiro/tabela-despesas"
import type { VendaRecente } from "@/components/financeiro/tabela-entradas"
import { calcularAlertasFinanceiros, calcularScale } from "@/lib/services/financial-alerts"
import type { AlertaFinanceiro } from "@/lib/services/financial-alerts"
import type { DashboardInsight } from "@/lib/types/dashboard"
import { getPeriodoLabel, getDailyCardMeta } from "@/lib/financeiro-utils"

// ─── Constants ──────────────────────────────────────────────────────────────

const META_MES_VENDAS = 200

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const CATEGORIA_PALETTE = [
  "#f97316", // produtos consolidados (FN+MA Produtos)
  "#6366f1", "#06b6d4", "#84cc16", "#eab308", "#ec4899",
  "#a855f7", "#14b8a6", "#f43f5e", "#64748b",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNum(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** R$ X.XXX,XX — preserva sinal de negativos */
function brl(v: number) {
  const n = toNum(v)
  const abs = Math.abs(n)
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(abs)
  return n < 0 ? `-${formatted}` : formatted
}

/** Despesas/gastos — sempre renderizado como -R$ X.XXX,XX */
function brlNeg(v: number) {
  return brl(-Math.abs(toNum(v)))
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

// ─── KPI Card primitives ─────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: string
  sub?: string
  icon?: typeof DollarSign
  accent?: "positive" | "negative" | "info" | "neutral"
  emphasized?: boolean
  loading?: boolean
  /** Texto explicativo acionado por ícone (i) ao lado do label. */
  tooltip?: string
  fonte?: string
}

function Kpi({ label, value, sub, icon: Icon, accent = "neutral", emphasized, loading, tooltip, fonte }: KpiProps) {
  const valueClass =
    accent === "positive" ? "text-emerald-600 dark:text-emerald-400"
    : accent === "negative" ? "text-rose-500"
    : accent === "info" ? "text-blue-600 dark:text-blue-400"
    : ""

  const iconClass =
    emphasized ? "text-emerald-700 dark:text-emerald-300"
    : accent === "positive" ? "text-emerald-500"
    : accent === "negative" ? "text-rose-400"
    : accent === "info" ? "text-blue-500"
    : "text-muted-foreground"

  const iconBgClass =
    emphasized ? "bg-emerald-100/70 dark:bg-emerald-900/30"
    : accent === "info" ? "bg-blue-100/60 dark:bg-blue-900/25"
    : "bg-muted/50"

  return (
    <Card className={emphasized ? "border-emerald-200/50 dark:border-emerald-800/40 bg-emerald-50/20 dark:bg-emerald-950/10" : ""}>
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between mb-1.5 gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
              {label}
            </p>
            {tooltip && (
              <UiTooltip>
                <UiTooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Sobre ${label}`}
                    className="rounded-full p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </UiTooltipTrigger>
                <UiTooltipContent side="top" className="max-w-[260px] whitespace-pre-line text-xs leading-snug">
                  {tooltip}
                </UiTooltipContent>
              </UiTooltip>
            )}
          </div>
          {Icon && (
            <div className={`rounded-md p-1.5 shrink-0 ${iconBgClass}`}>
              <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
            </div>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-8 w-32 rounded" />
        ) : (
          <p className={`text-2xl font-bold tracking-tight tabular-nums ${valueClass}`}>{value}</p>
        )}
        {sub && !loading && (
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        )}
        {fonte && (
          <span className="text-[10px] font-mono tracking-wide text-muted-foreground/40 select-none">{fonte}</span>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Alertas executivos (título + descrição + severidade) ──────────────────

type AlertaSeverity = "danger" | "warning" | "orange" | "info" | "success"
type Alerta = {
  tipo: AlertaSeverity
  titulo: string
  descricao?: string
  score?: number
}

const ALERTA_STYLE: Record<AlertaSeverity, { bg: string; text: string; border: string; iconBg: string }> = {
  danger:  { bg: "bg-rose-50/70 dark:bg-rose-950/30",     text: "text-rose-700 dark:text-rose-300",     border: "border border-rose-200/50 dark:border-rose-900/40",     iconBg: "bg-rose-100 dark:bg-rose-900/40" },
  warning: { bg: "bg-amber-50/70 dark:bg-amber-950/30",   text: "text-amber-700 dark:text-amber-300",   border: "border border-amber-200/50 dark:border-amber-900/40",   iconBg: "bg-amber-100 dark:bg-amber-900/40" },
  orange:  { bg: "bg-orange-50/70 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-300", border: "border border-orange-200/50 dark:border-orange-900/40", iconBg: "bg-orange-100 dark:bg-orange-900/40" },
  info:    { bg: "bg-blue-50/60 dark:bg-blue-950/30",     text: "text-blue-700 dark:text-blue-300",     border: "border border-blue-200/40 dark:border-blue-900/40",     iconBg: "bg-blue-100 dark:bg-blue-900/30" },
  success: { bg: "bg-emerald-50/60 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border border-emerald-200/40 dark:border-emerald-900/40", iconBg: "bg-emerald-100 dark:bg-emerald-900/30" },
}

function mapBaseTipo(tipo: AlertaFinanceiro["tipo"], mensagem: string): AlertaSeverity {
  if (tipo === "success") return "success"
  if (tipo === "info") return "info"
  return /lucro negativo|prejuízo|superam/i.test(mensagem) ? "danger" : "warning"
}

function pctDelta(atual: number, anterior: number): number | null {
  if (!Number.isFinite(anterior) || anterior <= 0) return null
  if (!Number.isFinite(atual)) return null
  return ((atual - anterior) / anterior) * 100
}

function formatComp(
  comp: { delta: number; direction: "up" | "down"; label?: string | null } | null | undefined,
  prevMonthName: string,
  isMTD?: boolean
): string | undefined {
  if (!comp || typeof comp.delta !== "number") return undefined
  const arrow = comp.direction === "up" ? "↑" : "↓"
  const label = comp.label ?? (isMTD ? `vs mesmo período de ${prevMonthName}` : `vs ${prevMonthName}`)
  return `${arrow} ${Math.abs(comp.delta).toFixed(1)}% ${label}`
}

// ─── Props ────────────────────────────────────────────────────────────────────


interface Props {
  initialSummary: DashboardSummary | null
  initialMes: number
  initialAno: number
  initialSummaryAnterior?: DashboardSummary | null
  availableYears: number[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FinanceiroFiltrado({
  initialSummary,
  initialMes,
  initialAno,
  initialSummaryAnterior = null,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mesAtual = initialMes
  const anoAtual = initialAno

  // URL m = 1-indexed (Jan=1 … Dec=12); state mes stays 0-indexed.
  const [mes, setMes] = useState(() => {
    const raw = searchParams.get("m")
    const m = raw !== null ? Number(raw) : NaN
    return !isNaN(m) && m >= 1 && m <= 12 ? m - 1 : initialMes
  })
  const [ano, setAno] = useState(() => {
    const y = Number(searchParams.get("y"))
    return y >= 2024 ? y : initialAno
  })
  // Default global = HOJE: quando não há filtro explícito e estamos no mês corrente, dia = hoje
  const [dia, setDia] = useState<number | null>(() => {
    const d = Number(searchParams.get("d"))
    if (d >= 1 && d <= 31) return d
    const hasExplicitMonth = searchParams.get("m") !== null || searchParams.get("y") !== null
    if (hasExplicitMonth) return null
    const now = new Date()
    if (initialMes === now.getMonth() && initialAno === now.getFullYear()) {
      return now.getDate()
    }
    return null
  })
  const [despesas, setDespesas] = useState<DespesaItem[]>([])
  const [entradas, setEntradas] = useState<VendaRecente[]>([])
  const [loadingTabelas, setLoadingTabelas] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    params.set("m", String(mes + 1)) // URL = 1-indexed
    params.set("y", String(ano))
    if (dia) params.set("d", String(dia))
    router.replace(`/financeiro?${params.toString()}`, { scroll: false })
  }, [mes, ano, dia, router])

  const maxMes     = ano === anoAtual ? mesAtual : 11
  const mesEfetivo = Math.min(mes, maxMes)
  const month1     = mesEfetivo + 1

  // ── queries isoladas — nunca compartilham cache entre si ───────────────────
  const monthlyQuery  = useFinancialMonthly(ano, month1, { initialData: initialSummary })
  const prevMonthQuery = useFinancialMonthly(
    mesAnterior(mesEfetivo, ano).ano,
    mesAnterior(mesEfetivo, ano).mes + 1,
    { initialData: initialSummaryAnterior ?? null }
  )
  const dailyQuery = useFinancialDaily(ano, month1, dia)

  const md          = monthlyQuery.data
  const mdPrev      = prevMonthQuery.data
  const loadingKpi  = monthlyQuery.isLoading && !md

  // tabelas de compras/vendas recentes — fetch manual isolado das queries de KPI
  useEffect(() => {
    let cancelled = false
    const { startDate, endDate } = gerarPeriodo(mesEfetivo, ano, dia)
    const params = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    type ComprasRes = { data?: DespesaItem[] }
    type VendasRes  = { data?: VendaRecente[] }

    setLoadingTabelas(true)
    Promise.all([
      fetch(`/api/financeiro/compras/recentes?${params}`)
        .then((r) => r.ok ? r.json() as Promise<ComprasRes> : ({} as ComprasRes))
        .catch(() => ({} as ComprasRes)),
      fetch(`/api/financeiro/vendas/recentes?${params}`)
        .then((r) => r.ok ? r.json() as Promise<VendasRes> : ({} as VendasRes))
        .catch(() => ({} as VendasRes)),
    ]).then(([despesasRes, entradasRes]) => {
      if (cancelled) return
      setDespesas(Array.isArray(despesasRes?.data) ? despesasRes.data : [])
      setEntradas(Array.isArray(entradasRes?.data) ? entradasRes.data : [])
      setLoadingTabelas(false)
    }).catch(() => { if (!cancelled) setLoadingTabelas(false) })

    return () => { cancelled = true }
  }, [mesEfetivo, ano, dia])

  // Consolidado: source of truth para grossProfit, realCompanyProfit, breakdown MA
  const consolidadoQuery   = useFinancialConsolidated(ano, month1)
  const consolidado        = consolidadoQuery.data
  const consolidadoLoading = consolidadoQuery.isLoading && !consolidado

  // Consolidado do mês anterior — alimenta comparativos executivos
  const { mes: prevMes0, ano: prevAno0 } = mesAnterior(mesEfetivo, ano)
  const consolidadoAnteriorQuery = useFinancialConsolidated(prevAno0, prevMes0 + 1)
  const consolidadoAnterior      = consolidadoAnteriorQuery.data

  const handleMonthChange = useCallback((m: number, y: number) => { setMes(m); setAno(y); setDia(null) }, [])
  const handleToday = useCallback(() => {
    const now = new Date()
    setMes(now.getMonth()); setAno(now.getFullYear()); setDia(now.getDate())
  }, [])
  const handleDateSelect = useCallback((date: Date | null) => {
    if (!date) { setDia(null); return }
    setMes(date.getMonth()); setAno(date.getFullYear()); setDia(date.getDate())
  }, [])

  const today = new Date()

  // ── KPIs canônicos — fonte: md (useFinancialMonthly → /api/dashboard/summary) ──
  // Frontend APENAS RENDERIZA. Sem cálculo local para KPIs financeiros.
  const lucroLiquidoDia  = dia !== null ? toNum(dailyQuery.data?.lucroLiquidoDia) : toNum(md?.lucroLiquidoDia)
  const totalVendas      = toNum(md?.totalVendas)
  const ticketMedio      = toNum(md?.ticketMedio)

  // Canonical fields (pass-through from backend)
  const faturamento      = toNum(md?.faturamentoMes)
  const receitaBruta     = faturamento  // alias for comparatives
  const lucroBruto       = toNum(md?.lucroBrutoMes ?? md?.lucroOperacionalMes)
  const lucroLiquidoReal = toNum(md?.lucroLiquidoReal)
  const totalDespesas    = toNum(md?.totalGastos ?? md?.despesasMes ?? md?.comprasMes)
  const burnRate         = toNum(consolidado?.fixedExpenses)  // kept from consolidado (not in canonical yet)

  // Margin ratios derived from canonical values (display transforms only, not new calculations)
  const margemBruta      = faturamento > 0 ? (lucroBruto / faturamento) * 100 : 0
  const margemReal       = faturamento > 0 ? (lucroLiquidoReal / faturamento) * 100 : 0

  // Consolidado kept for: donut chart categories, insights comparatives, maAvailable check
  const maCount        = consolidado?.breakdown?.meuAssessor?.count ?? 0
  const maAvailable    = !consolidadoLoading && !consolidadoQuery.isError && maCount > 0
  const fnSourceType   = consolidado?.breakdown?.fn?.sourceType
  const sourceIsError  = !consolidadoLoading && (fnSourceType === "error" || fnSourceType === "unknown")
  const fnIsStable     = fnSourceType === "live" || fnSourceType === "snapshot"

  const lucroLiquido     = toNum(consolidado?.netProfit)
  const fixedExpensesFn  = toNum(consolidado?.fixedExpenses)
  const adminExpenses    = toNum(consolidado?.administrativeExpenses)
  const netProfitFn      = lucroLiquido

  // Produtos vendidos (canonical)
  const produtosVendidos   = md?.produtosVendidosMes ?? null
  const produtosBreakdown  = md?.produtosVendidosBreakdown ?? null
  const produtosSubtitle = produtosBreakdown
    ? (() => {
        // Prefer new status-based breakdown (concluidos/pendentes)
        if (produtosBreakdown.concluidos != null || produtosBreakdown.pendentes != null) {
          return [
            produtosBreakdown.concluidos != null ? `Concluídos: ${produtosBreakdown.concluidos}` : null,
            produtosBreakdown.pendentes  != null ? `Pendentes: ${produtosBreakdown.pendentes}`   : null,
            produtosBreakdown.outros     != null && produtosBreakdown.outros > 0 ? `Outros: ${produtosBreakdown.outros}` : null,
          ].filter(Boolean).join(" • ") || null
        }
        // Legacy: only show non-zero type breakdown (zero acessorios/aparelhos são sem sentido)
        return [
          produtosBreakdown.acessorios ? `Acessórios: ${produtosBreakdown.acessorios}` : null,
          produtosBreakdown.aparelhos  ? `Aparelhos: ${produtosBreakdown.aparelhos}`   : null,
          produtosBreakdown.outros     ? `Outros: ${produtosBreakdown.outros}`          : null,
        ].filter(Boolean).join(" • ") || null
      })()
    : null

  const margemBrutaCalc = margemBruta

  // Para comparativos absolutos (queda vs mês anterior) — fonte: prevMonthQuery
  const grossProfitAnt = toNum(mdPrev?.lucroOperacionalMes ?? mdPrev?.lucroBrutoMes)
  const ticketAnt      = toNum(mdPrev?.ticketMedio)

  const dailyCardMeta = getDailyCardMeta({
    dia, mes: mesEfetivo, ano,
    mesAtual: today.getMonth(), anoAtual: today.getFullYear(), diaAtual: today.getDate(),
    lucroLiquidoDia: (dia !== null ? dailyQuery.data?.lucroLiquidoDia : md?.lucroLiquidoDia) ?? null,
  })

  // Meta e progresso de produtos
  const metaProdutos = toNum(md?.produtosVendidosMeta) > 0 ? toNum(md?.produtosVendidosMeta) : 300
  const pctProdutos  = md?.produtosVendidosPercentual != null
    ? Math.round(toNum(md?.produtosVendidosPercentual))
    : produtosVendidos != null && metaProdutos > 0
      ? Math.round((produtosVendidos / metaProdutos) * 100)
      : null

  // Produtos Vendidos Dia (canonical — pass-through do backend)
  const produtosVendidosDia   = md?.produtosVendidosDia ?? null
  const produtosBreakdownDia  = md?.produtosVendidosDiaBreakdown ?? null
  const produtosSubtitleDia   = produtosBreakdownDia
    ? [
        produtosBreakdownDia.concluidos != null ? `Concluídos: ${produtosBreakdownDia.concluidos}` : null,
        produtosBreakdownDia.pendentes  != null ? `Pendentes: ${produtosBreakdownDia.pendentes}`   : null,
      ].filter(Boolean).join(" • ") || null
    : null



  // ── Donut: Despesas por Categoria (visão gerencial) ──
  // Fonte ÚNICA: categorias reais do snapshot (Expense + ExpenseFixed + MA).
  // Não usa `revenue - grossProfit` — COGS NÃO é despesa percebida pelo usuário.
  // Compras de estoque ("Produtos" do MA) também são excluídas — entram via Lucro Bruto.
  const categoriasDonut = useMemo(() => {
    const maCats = consolidado?.breakdown?.meuAssessor?.categories ?? []
    const isProdutos = (c: string) =>
      /^produtos?$/i.test(c.trim()) || /produto/i.test(c.trim())

    return maCats
      .filter((c) => !isProdutos(c.categoria) && toNum(c.valor) > 0)
      .map((c) => ({ categoria: c.categoria, valor: toNum(c.valor) }))
      .sort((a, b) => b.valor - a.valor)
      .map((s, i) => ({ ...s, cor: CATEGORIA_PALETTE[i % CATEGORIA_PALETTE.length] }))
  }, [consolidado])

  const totalDonut = categoriasDonut.reduce((s, c) => s + c.valor, 0)

  const isMesAtual = mesEfetivo === today.getMonth() && ano === today.getFullYear()
  const diaAtual = isMesAtual ? today.getDate() : null
  // Cards diários: mês histórico sem dia selecionado → não exibir R$0,00 (null ≠ zero real)
  const dailyRequiresDate = dia === null && !isMesAtual

  // Comparisons — do backend via route.ts (inclui label correto MTD vs mês fechado).
  const compSubFaturamento = formatComp(md?.comparisons?.faturamentoMes,      MESES[prevMes0], isMesAtual)
  const compSubGastos      = formatComp(md?.comparisons?.totalGastos,          MESES[prevMes0], isMesAtual)
  const compSubProdutos    = formatComp(md?.comparisons?.produtosVendidosMes,  MESES[prevMes0], isMesAtual)
  const compSubLucroBruto  = formatComp(md?.comparisons?.lucroBrutoMes,        MESES[prevMes0], isMesAtual)
  const compSubLucroReal   = formatComp(md?.comparisons?.lucroLiquidoReal,     MESES[prevMes0], isMesAtual)
  const { mes: prevMesN, ano: prevAnoN } = mesAnterior(mesEfetivo, ano)
  const diasPrevMes = diasNoMes(prevMesN, prevAnoN)
  const scale = calcularScale(isMesAtual, diaAtual, diasPrevMes)

  // ── Comparativos com mês anterior (canonical: consolidado anterior) ─────
  // Comparativos M vs M-1 — exclusivamente do snapshot do mês anterior.
  const revenueAnt    = toNum(consolidadoAnterior?.revenue)
  const realProfitAnt = toNum(consolidadoAnterior?.realCompanyProfit)
  const realMarginAnt = toNum(consolidadoAnterior?.realMargin)
  const adminAnt      = toNum(consolidadoAnterior?.administrativeExpenses)
  const fixedAnt      = toNum(consolidadoAnterior?.fixedExpenses)
  // Burn rate anterior também via snapshot — equivale a fixedExpenses anterior.
  const burnAnt       = fixedAnt
  const compraTotal      = useMemo(() => despesas.reduce((s, d) => s + toNum(d.totalCusto ?? d.valor ?? d.amount), 0), [despesas])
  const prevMonthLabel = MESES[prevMes0]

  // ── Insights executivos (até 3) — comparativos M vs M-1 ────────────────────
  const insights = useMemo((): Alerta[] => {
    if (!consolidado || !consolidadoAnterior || !fnIsStable || !maAvailable) return []

    const out: Array<Alerta & { score: number }> = []
    const dRev   = pctDelta(faturamento, revenueAnt)
    const dReal  = pctDelta(lucroLiquidoReal, realProfitAnt)
    const dAdmin = pctDelta(adminExpenses, adminAnt)
    const dBurn  = pctDelta(burnRate, burnAnt)
    const dMargin = realMarginAnt > 0 ? margemReal - realMarginAnt : null // pontos percentuais

    // 1. Faturou menos mas lucrou mais (caso clássico de eficiência)
    if (dRev !== null && dReal !== null && dRev < -2 && dReal > 5) {
      out.push({
        tipo: "success",
        score: 220,
        titulo: `${MESES[mesEfetivo]} faturou ${Math.abs(dRev).toFixed(0)}% menos que ${prevMonthLabel}…`,
        descricao: `…mas o lucro líquido real subiu ${dReal.toFixed(0)}% (${brl(lucroLiquidoReal)}). Eficiência operacional melhorou.`,
      })
    }

    // 2. Margem melhorou apesar de receita cair
    if (dRev !== null && dRev < -2 && dMargin !== null && dMargin > 1) {
      out.push({
        tipo: "success",
        score: 190,
        titulo: `Margem real subiu ${dMargin.toFixed(1)} p.p. mesmo com queda de faturamento`,
        descricao: `Margem hoje: ${margemReal.toFixed(1)}% (${realMarginAnt.toFixed(1)}% em ${prevMonthLabel}).`,
      })
    }

    // 3. Burn rate melhorou
    if (dBurn !== null && dBurn < -5 && burnAnt > 0) {
      out.push({
        tipo: "success",
        score: 170,
        titulo: `Burn rate melhorou ${Math.abs(dBurn).toFixed(0)}% vs ${prevMonthLabel}`,
        descricao: `Custos recorrentes caíram de ${brl(burnAnt)} para ${brl(burnRate)}.`,
      })
    }

    // 4. Despesas administrativas dispararam
    if (dAdmin !== null && dAdmin > 15) {
      out.push({
        tipo: "warning",
        score: 200,
        titulo: `Despesas administrativas subiram ${dAdmin.toFixed(0)}% vs ${prevMonthLabel}`,
        descricao: `Saiu de ${brlNeg(adminAnt)} para ${brlNeg(adminExpenses)}. Auditar categorias.`,
      })
    }

    // 5. Maior faturamento ≠ maior lucro
    if (dRev !== null && dReal !== null && dRev > 5 && dReal < -5) {
      out.push({
        tipo: "warning",
        score: 210,
        titulo: "Faturamento subiu mas lucro caiu",
        descricao: `Receita +${dRev.toFixed(0)}%, lucro real ${dReal.toFixed(0)}%. Custos cresceram acima do ritmo de receita.`,
      })
    }

    // 6. Compras de estoque cresceram muito (FN compras vs faturamento)
    if (faturamento > 0 && compraTotal > 0) {
      const pctCompra = (compraTotal / faturamento) * 100
      if (pctCompra > 30) {
        out.push({
          tipo: "info",
          score: 130,
          titulo: `Compras de estoque representam ${pctCompra.toFixed(0)}% da receita`,
          descricao: `${brlNeg(compraTotal)} comprados em produtos no período.`,
        })
      }
    }

    // 7. Lucro real cresceu fortemente (tendência positiva)
    if (dReal !== null && dReal > 20 && lucroLiquidoReal > 0) {
      out.push({
        tipo: "success",
        score: 180,
        titulo: `Lucro líquido real cresceu ${dReal.toFixed(0)}% vs ${prevMonthLabel}`,
        descricao: `Saiu de ${brl(realProfitAnt)} para ${brl(lucroLiquidoReal)}.`,
      })
    }

    return out.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3)
  }, [
    consolidado, consolidadoAnterior, mesEfetivo, prevMonthLabel,
    faturamento, revenueAnt, lucroLiquidoReal, realProfitAnt,
    adminExpenses, adminAnt, burnRate, burnAnt,
    margemReal, realMarginAnt, compraTotal,
    fnIsStable, maAvailable,
  ])

  const alertas = useMemo((): Alerta[] => {
    const s = (v: unknown) => toNum(v) * scale
    // Engine de alertas usa SEMPRE o snapshot canônico (consolidado).
    // Só executa quando dados são estáveis e MA está disponível.
    const base = (fnIsStable && maAvailable) ? calcularAlertasFinanceiros({
      fat:            receitaBruta,
      fatAnt:         s(consolidadoAnterior?.revenue),
      lucro:          lucroLiquido,
      lucroAnt:       s(consolidadoAnterior?.netProfit),
      margem:         receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0,
      margemAnt:      toNum(mdPrev?.margemLiquida),
      margemBruta:    margemBrutaCalc,
      margemBrutaAnt: toNum(mdPrev?.margemBruta),
      desp:           totalDespesas,
      despAnt:        s(consolidadoAnterior?.totalExpense ?? consolidadoAnterior?.totalExpenses),
      vendas:         totalVendas,
      vendasAnt:      s(mdPrev?.totalVendas),
      ticket:         ticketMedio,
      ticketAnt,
      metaVendas:     META_MES_VENDAS,
      isMesAtual,
      diaAtual,
    }, 4) : []

    // ── Alertas estado-absoluto + comparativos com prevMonth ────────────────
    const extras: Alerta[] = []

    if (fnIsStable && maAvailable && faturamento > 0 && margemReal > 0 && margemReal < 3) {
      extras.push({
        tipo: "danger",
        titulo: "Margem líquida abaixo do ideal",
        descricao: `Margem real ${margemReal.toFixed(1)}% — ideal acima de 5%.`,
        score: 280,
      })
    }

    if (fnIsStable && maAvailable && adminExpenses > 0 && netProfitFn > 0 && adminExpenses > netProfitFn) {
      extras.push({
        tipo: "danger",
        titulo: "Despesas administrativas consumindo lucro",
        descricao: `${brlNeg(adminExpenses)} em despesas vs ${brl(netProfitFn)} de lucro operacional.`,
        score: 270,
      })
    }

    if (grossProfitAnt > 0 && lucroBruto > 0 && lucroBruto < grossProfitAnt * scale * 0.95) {
      const dGB = ((lucroBruto - grossProfitAnt * scale) / (grossProfitAnt * scale)) * 100
      extras.push({
        tipo: "warning",
        titulo: `Lucro bruto caiu ${Math.abs(dGB).toFixed(0)}% vs ${prevMonthLabel}`,
        descricao: `Lucro bruto hoje: ${brl(lucroBruto)}. Revisar mix de produtos ou margem.`,
        score: 230,
      })
    }

    if (ticketAnt > 0 && ticketMedio > 0 && ticketMedio < ticketAnt * 0.85) {
      const dT = ((ticketMedio - ticketAnt) / ticketAnt) * 100
      extras.push({
        tipo: "warning",
        titulo: `Ticket médio em queda (${Math.abs(dT).toFixed(0)}%)`,
        descricao: `Ticket atual: ${brl(ticketMedio)} (era ${brl(ticketAnt)}).`,
        score: 210,
      })
    }

    if (
      burnRate > 0 &&
      ((lucroLiquidoReal > 0 && burnRate > lucroLiquidoReal * 1.5) ||
        (faturamento > 0 && burnRate > faturamento * 0.05))
    ) {
      extras.push({
        tipo: "orange",
        titulo: "Burn rate elevado",
        descricao: `Custo recorrente ${brlNeg(burnRate)} vs lucro real ${brl(lucroLiquidoReal)}.`,
        score: 200,
      })
    }

    // Mapeia engine antiga (mensagem string) para o novo shape
    const mapped: Alerta[] = base.map((a) => ({
      tipo: mapBaseTipo(a.tipo, a.mensagem),
      titulo: a.mensagem,
      score: a.score,
    }))

    const order: Record<AlertaSeverity, number> = { danger: 0, warning: 1, orange: 2, info: 3, success: 4 }
    const seen = new Set<string>()
    const all = [...extras, ...mapped]
      .filter((a) => {
        const key = a.titulo.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => {
        const sevDiff = order[a.tipo] - order[b.tipo]
        if (sevDiff !== 0) return sevDiff
        return (b.score ?? 0) - (a.score ?? 0)
      })

    return all.slice(0, 5)
  }, [
    md, mdPrev, isMesAtual, diaAtual, scale,
    faturamento, margemReal, adminExpenses, netProfitFn,
    grossProfitAnt, lucroBruto, ticketMedio, ticketAnt,
    burnRate, lucroLiquidoReal, prevMonthLabel,
    fnIsStable, maAvailable,
  ])

  const periodoLabel = getPeriodoLabel({
    dia, mes: mesEfetivo, ano,
    mesAtual: today.getMonth(), anoAtual: today.getFullYear(),
  })

  const now = new Date()
  const selectedDate = dia ? new Date(ano, mesEfetivo, dia) : null

  return (
    <UiTooltipProvider delayDuration={150}>
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Financeiro</h2>
            {md?.stale && (
              <UiTooltip>
                <UiTooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/50 bg-amber-50/80 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400 cursor-default select-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {md.syncedAt
                      ? `Cache · ${Math.max(1, Math.round((Date.now() - new Date(md.syncedAt).getTime()) / 60000))} min atrás`
                      : "Dados em cache"}
                  </span>
                </UiTooltipTrigger>
                <UiTooltipContent side="right" className="max-w-[240px] text-xs leading-snug">
                  A Fone Ninja demorou para responder. Exibindo último dado válido.
                </UiTooltipContent>
              </UiTooltip>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {periodoLabel}
            {(monthlyQuery.isFetching && !loadingKpi) && (
              <span className="ml-2 text-xs text-muted-foreground/60 animate-pulse">atualizando…</span>
            )}
          </p>
        </div>
      </div>




      <GlobalDateFilter
        month={mesEfetivo}
        year={ano}
        selectedDate={selectedDate}
        maxDate={new Date(anoAtual, mesAtual, now.getDate())}
        onMonthChange={handleMonthChange}
        onToday={handleToday}
        onDateSelect={handleDateSelect}
      />



      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — Visão Executiva
          3 KPIs: Faturamento do Mês · Faturamento do Dia · Total de Gastos
          ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold tracking-tight">Visão Executiva</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Kpi
            label="Faturamento do Mês"
            value={brl(faturamento)}
            sub={compSubFaturamento}
            icon={DollarSign}
            accent="info"
            loading={loadingKpi}
            tooltip={"O que é: Receita bruta total do período — soma de todas as vendas.\n\nOrigem: Fone Ninja via backend.\n\nAtualização: Sincronização automática diária."}
          />
          <Kpi
            label="Faturamento do Dia"
            value={dailyRequiresDate ? "—" : brl(dia !== null ? toNum(dailyQuery.data?.faturamentoDia) : toNum(md?.faturamentoDia))}
            sub={dailyRequiresDate ? "Selecione um dia para ver" : dailyCardMeta.descricao}
            icon={Calendar}
            accent={dailyRequiresDate ? "neutral" : "info"}
            loading={loadingKpi || (dia !== null && dailyQuery.isLoading)}
            tooltip={"O que é: Receita bruta do dia selecionado. Sem seleção de dia, exibe o dia atual.\n\nOrigem: Fone Ninja via backend.\n\nAtualização: Sincronização automática diária."}
          />
          <Kpi
            label="Total de Gastos"
            value={brlNeg(totalDespesas)}
            sub={compSubGastos}
            icon={ShoppingBag}
            accent="negative"
            loading={loadingKpi}
            tooltip={"O que é: Custo total do período (CMV + despesas operacionais).\n\nOrigem: backend /api/dashboard/summary.\n\nAtualização: Sincronização automática diária."}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — Lucro
          ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold tracking-tight">Lucro</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi
            label="Lucro Líquido do Dia"
            value={dailyRequiresDate ? "—" : brl(lucroLiquidoDia)}
            sub={dailyRequiresDate ? "Selecione um dia para ver" : dailyCardMeta.descricao}
            icon={Calendar}
            accent={dailyRequiresDate ? "neutral" : lucroLiquidoDia >= 0 ? "positive" : "negative"}
            loading={loadingKpi || (dia !== null && dailyQuery.isLoading)}
            tooltip={"O que é: Lucro líquido consolidado do dia — receita do dia menos despesas proporcionais.\n\nOrigem: FinancialSnapshot diário via Fone Ninja.\n\nAtualização: Sincronização automática diária."}
          />
          <Kpi
            label="Lucro Bruto do Mês"
            value={brl(lucroBruto)}
            sub={compSubLucroBruto ?? (faturamento > 0 ? `Margem ${margemBrutaCalc.toFixed(1)}%` : undefined)}
            icon={TrendingUp}
            accent={lucroBruto >= 0 ? "positive" : "negative"}
            loading={loadingKpi}
            tooltip={"O que é: Receita total menos o custo das mercadorias vendidas (CMV). Não considera despesas operacionais.\n\nOrigem: Fone Ninja via backend.\n\nAtualização: Sincronização automática diária."}
          />
          <Kpi
            label="Lucro Líquido Real"
            value={brl(lucroLiquidoReal > 0 ? lucroLiquidoReal : lucroLiquido)}
            sub={compSubLucroReal ?? (faturamento > 0 ? `Margem ${margemReal.toFixed(1)}%` : undefined)}
            icon={Wallet}
            accent={lucroLiquidoReal >= 0 ? "positive" : "negative"}
            emphasized
            loading={loadingKpi}
            tooltip={"O que é: Resultado final após dedução de todas as despesas. É o dinheiro que sobra de fato.\n\nOrigem: Fone Ninja + MeuAssessor via backend.\n\nAtualização: Sincronização automática diária."}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — Produtos Vendidos
          3 cards: Meta de Produtos · Produtos Vendidos Mês · Produtos Vendidos Dia
          ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold tracking-tight">Produtos Vendidos</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 — Meta de Produtos (progress bar) */}
          <Card>
            <CardContent className="p-3.5">
              <div className="flex items-start justify-between mb-1.5 gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Meta de Produtos
                </p>
                <div className="rounded-md p-1.5 shrink-0 bg-muted/50">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              {loadingKpi ? (
                <Skeleton className="h-8 w-32 rounded" />
              ) : (
                <p className="text-2xl font-bold tracking-tight tabular-nums text-blue-600 dark:text-blue-400">
                  {produtosVendidos != null ? String(produtosVendidos) : "—"}
                </p>
              )}
              {!loadingKpi && produtosVendidos != null && (
                <>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Meta: {metaProdutos}</span>
                    <span className="tabular-nums">{produtosVendidos} / {metaProdutos} · {pctProdutos ?? 0}%</span>
                  </div>
                  <div className="mt-1 w-full rounded-full bg-muted/50 h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${(pctProdutos ?? 0) >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(100, pctProdutos ?? 0)}%` }}
                    />
                  </div>
                  {compSubProdutos && (
                    <p className="mt-1 text-xs text-muted-foreground">{compSubProdutos}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 2 — Produtos Vendidos Mês (status breakdown) */}
          <Kpi
            label="Produtos Vendidos Mês"
            value={loadingKpi ? "…" : produtosVendidos != null ? String(produtosVendidos) : "—"}
            sub={produtosSubtitle ?? (compSubProdutos ?? undefined)}
            icon={Package}
            accent="info"
            loading={loadingKpi}
            tooltip={"O que é: Total de produtos vendidos no mês. Breakdown por status: Concluídos e Pendentes.\n\nOrigem: Fone Ninja via backend.\n\nAtualização: Sincronização automática."}
          />

          {/* Card 3 — Produtos Vendidos Dia */}
          <Kpi
            label="Produtos Vendidos Dia"
            value={dailyRequiresDate ? "—" : loadingKpi ? "…" : produtosVendidosDia != null ? String(produtosVendidosDia) : "—"}
            sub={dailyRequiresDate ? "Selecione um dia para ver" : (produtosSubtitleDia ?? undefined)}
            icon={Package}
            accent={dailyRequiresDate ? "neutral" : "info"}
            loading={loadingKpi || (dia !== null && dailyQuery.isLoading)}
            tooltip={"O que é: Produtos vendidos no dia selecionado.\n\nOrigem: Fone Ninja via backend.\n\nAtualização: Sincronização automática."}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          INSIGHTS INTELIGENTES
          Prioriza data.insights do backend; cai nos computados se ausentes.
          ═══════════════════════════════════════════════════════════════ */}
      {(() => {
        const backendInsights = (Array.isArray(md?.insights) ? (md.insights as DashboardInsight[]) : [])
        const showBackend     = backendInsights.length > 0
        const showComputed    = !showBackend && insights.length > 0
        // Se insights narrativos indisponíveis, exibir alertas financeiros (mesma fonte do Dashboard)
        const showAlerts      = !showBackend && !showComputed && alertas.length > 0
        return (
          <Card className="border-blue-200/40 dark:border-blue-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Insights Inteligentes
                <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                  {MESES[mesEfetivo]} {ano}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {showBackend ? (
                backendInsights.map((ins, i) => {
                  const style = ALERTA_STYLE[ins.type as keyof typeof ALERTA_STYLE] ?? ALERTA_STYLE.info
                  const Icon = ins.type === "success" ? TrendingUp
                    : ins.type === "danger" ? AlertCircle
                    : ins.type === "warning" ? AlertTriangle
                    : ArrowUpRight
                  return (
                    <div key={i} className={`flex items-start gap-2.5 rounded-md px-3 py-2 ${style.bg} ${style.text} ${style.border}`}>
                      <div className={`rounded-md p-1 shrink-0 ${style.iconBg}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-tight">{ins.title}</p>
                        <p className="text-[11px] leading-snug opacity-80 mt-0.5">{ins.message}</p>
                        {ins.recommendation && (
                          <p className="text-[11px] leading-snug text-muted-foreground mt-0.5 italic">{ins.recommendation}</p>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : showComputed ? (
                insights.map((ins, i) => {
                  const Icon = ins.tipo === "success" ? TrendingUp
                    : ins.tipo === "danger" ? AlertCircle
                    : ins.tipo === "warning" ? AlertTriangle
                    : ArrowUpRight
                  const style = ALERTA_STYLE[ins.tipo]
                  return (
                    <div key={i} className={`flex items-start gap-2.5 rounded-md px-3 py-2 ${style.bg} ${style.text} ${style.border}`}>
                      <div className={`rounded-md p-1 shrink-0 ${style.iconBg}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-tight">{ins.titulo}</p>
                        {ins.descricao && <p className="text-[11px] leading-snug opacity-80 mt-0.5">{ins.descricao}</p>}
                      </div>
                    </div>
                  )
                })
              ) : showAlerts ? (
                alertas.slice(0, 5).map((a, i) => {
                  const Icon = a.tipo === "success" ? TrendingUp
                    : a.tipo === "danger" ? AlertCircle
                    : a.tipo === "warning" ? AlertTriangle
                    : a.tipo === "orange" ? Flame
                    : ArrowUpRight
                  const style = ALERTA_STYLE[a.tipo]
                  return (
                    <div key={i} className={`flex items-start gap-2.5 rounded-md px-3 py-2 ${style.bg} ${style.text} ${style.border}`}>
                      <div className={`rounded-md p-1 shrink-0 ${style.iconBg}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-tight">{a.titulo}</p>
                        {a.descricao && <p className="text-[11px] leading-snug opacity-80 mt-0.5">{a.descricao}</p>}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  Sem dados suficientes para gerar insights neste período.
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — Monitoramento
          ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold tracking-tight">Monitoramento</h3>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alerta Financeiro
                {isMesAtual && diaAtual && (
                  <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                    primeiros {diaAtual} dias
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {alertas.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  Nenhum desvio relevante.
                </div>
              ) : (
                alertas.map((a, i) => {
                  const Icon = a.tipo === "success" ? CheckCircle2
                    : a.tipo === "danger" ? AlertCircle
                    : a.tipo === "orange" ? Flame
                    : a.tipo === "warning" ? AlertTriangle
                    : ArrowUpRight
                  const style = ALERTA_STYLE[a.tipo]
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-2.5 rounded-md px-3 py-2 ${style.bg} ${style.text} ${style.border}`}
                    >
                      <div className={`rounded-md p-1 shrink-0 ${style.iconBg}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-tight">{a.titulo}</p>
                        {a.descricao && (
                          <p className="text-[11px] leading-snug opacity-80 mt-0.5">{a.descricao}</p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <TabelaEntradas entradas={entradas} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4 — Análises (Donut)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold tracking-tight">Análises</h3>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Despesas por Categoria</span>
                {totalDonut > 0 && (
                  <span className="text-xs font-normal text-rose-500 tabular-nums">
                    {brlNeg(totalDonut)}
                  </span>
                )}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Operacionais + administrativas + fixas. CMV não incluso (já no Lucro Bruto).
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-5 min-w-0 min-h-[220px]">
                <div className="relative h-[220px] w-full md:w-[220px] shrink-0 min-w-0">
                  {categoriasDonut.length === 0 ? (
                    <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-muted-foreground leading-snug">
                      Nenhuma despesa registrada no período.
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie
                            data={categoriasDonut}
                            dataKey="valor"
                            nameKey="categoria"
                            cx="50%"
                            cy="50%"
                            outerRadius={88}
                            innerRadius={62}
                            paddingAngle={0.5}
                            stroke="none"
                            isAnimationActive={false}
                          >
                            {categoriasDonut.map((d) => (
                              <Cell key={d.categoria} fill={d.cor} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v) => brlNeg(Number(v))}
                            contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Centro do donut — total */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">total</span>
                        <span className="text-base font-bold tabular-nums text-rose-500">
                          {brlNeg(totalDonut)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-1 w-full flex flex-col gap-1.5 min-w-0">
                  {categoriasDonut.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Nenhuma despesa registrada no período.
                    </span>
                  ) : (
                    categoriasDonut.map((item) => {
                      const pct = totalDonut > 0 ? (item.valor / totalDonut) * 100 : 0
                      return (
                        <div key={item.categoria} className="flex items-center justify-between text-xs gap-3">
                          <span className="flex items-center gap-2 text-muted-foreground min-w-0">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                              style={{ background: item.cor }}
                            />
                            <span className="truncate">{item.categoria}</span>
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-muted-foreground/70 tabular-nums w-9 text-right">
                              {pct.toFixed(0)}%
                            </span>
                            <span className="font-medium tabular-nums text-rose-500 w-24 text-right">
                              {brlNeg(item.valor)}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <TabelaDespesas despesas={despesas} loading={loadingTabelas} />
        </div>
      </section>

    </div>
    </UiTooltipProvider>
  )
}
