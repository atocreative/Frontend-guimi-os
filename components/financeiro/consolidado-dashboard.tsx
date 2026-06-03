"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  TrendingUp, TrendingDown, Radio, RefreshCw,
  Database, Activity, Lock, AlertTriangle, Info,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { GlobalDateFilter } from "@/components/global/global-date-filter"
import { getPeriodoLabel } from "@/lib/financeiro-utils"
import { useFinanceiroConsolidado } from "@/lib/queries/use-financeiro-consolidado"

function brl(v: number | undefined | null) {
  const n = Number(v ?? 0)
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)
}

function pct(v: number | undefined | null) {
  const n = Number(v ?? 0)
  return `${Number.isFinite(n) ? n.toFixed(1) : "0.0"}%`
}

function compact(v: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(
    Number.isFinite(v) ? v : 0,
  )
}

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  tooltip?: string
  trend?: "up" | "down" | "neutral"
  loading?: boolean
  accent?: "green" | "red" | "blue" | "default"
  emphasized?: boolean
}

function KpiCard({ label, value, sub, tooltip, trend, loading, accent = "default", emphasized }: KpiCardProps) {
  const accentClass =
    accent === "green" ? "text-emerald-600 dark:text-emerald-400"
    : accent === "red" ? "text-red-500"
    : accent === "blue" ? "text-blue-600 dark:text-blue-400"
    : ""

  return (
    <Card className={emphasized ? "border-emerald-400 dark:border-emerald-600 shadow-md ring-1 ring-emerald-200 dark:ring-emerald-800" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            {tooltip && (
              <span title={tooltip} className="cursor-help text-muted-foreground/50 hover:text-muted-foreground">
                <Info className="h-3 w-3" />
              </span>
            )}
          </div>
          {trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
          {trend === "down" && <TrendingDown className="h-4 w-4 text-red-400" />}
          {trend === "neutral" && <Activity className="h-4 w-4 text-muted-foreground" />}
        </div>
        {loading ? (
          <Skeleton className="h-8 w-32 rounded" />
        ) : (
          <p className={`text-2xl font-bold tabular-nums ${accentClass}`}>{value}</p>
        )}
        {sub && !loading && (
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">{sub}</p>
        )}
      </CardContent>
    </Card>
  )
}

interface Props {
  initialMes: number
  initialAno: number
  availableYears: number[]
}

export function ConsolidadoDashboard({ initialMes, initialAno }: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const today        = new Date()
  const mesAtual     = today.getMonth()
  const anoAtual     = today.getFullYear()

  const [mes, setMes] = useState(() => {
    const raw = searchParams.get("m")
    const m   = raw !== null ? Number(raw) : NaN
    return !isNaN(m) && m >= 0 && m <= 11 ? m : initialMes
  })
  const [ano, setAno] = useState(() => {
    const y = Number(searchParams.get("y"))
    return y >= 2024 ? y : initialAno
  })

  const maxMes     = ano === anoAtual ? mesAtual : 11
  const mesEfetivo = Math.min(mes, maxMes)
  const month1     = mesEfetivo + 1
  const isMesAtual = mesEfetivo === mesAtual && ano === anoAtual

  const syncUrl = useCallback((m: number, a: number) => {
    const p = new URLSearchParams()
    p.set("m", String(m))
    p.set("y", String(a))
    router.replace(`/financeiro/consolidado?${p.toString()}`, { scroll: false })
  }, [router])

  const handleMonthChange = useCallback((m: number, y: number) => {
    setMes(m); setAno(y); syncUrl(m, y)
  }, [syncUrl])

  const handleToday = useCallback(() => {
    const now = new Date()
    setMes(now.getMonth()); setAno(now.getFullYear())
    syncUrl(now.getMonth(), now.getFullYear())
  }, [syncUrl])

  const handleDateSelect = useCallback((date: Date | null) => {
    if (!date) return
    setMes(date.getMonth()); setAno(date.getFullYear())
    syncUrl(date.getMonth(), date.getFullYear())
  }, [syncUrl])

  const { data, isLoading, isFetching, isError, dataUpdatedAt } = useFinanceiroConsolidado(ano, month1)

  const loading    = isLoading && !data
  const refreshing = isFetching && !loading
  const lastSync   = dataUpdatedAt ? new Date(dataUpdatedAt) : null

  const revenue     = data?.revenue ?? 0
  const grossProfit = data?.grossProfit ?? 0
  const netProfit   = data?.netProfit ?? 0

  // Total de Gastos: usa campo canônico da API quando disponível, senão deriva.
  const totalGastos = data?.totalExpense != null
    ? data.totalExpense
    : data?.totalExpenses != null
      ? data.totalExpenses
      : Math.max(0, grossProfit - netProfit)

  // Lucro Líquido = Lucro Bruto − Total de Gastos (espelha netProfit do backend).
  const lucroLiquido = grossProfit - totalGastos

  const grossMargin   = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const liquidMargin  = revenue > 0 ? (lucroLiquido / revenue) * 100 : 0

  const fnBreakdown = data?.breakdown?.fn
  const maBreakdown = data?.breakdown?.meuAssessor

  const topCategorias = useMemo(() => {
    const cats = maBreakdown?.categories ?? []
    return [...cats].sort((a, b) => b.valor - a.valor).slice(0, 5)
  }, [maBreakdown])

  const periodoLabel = getPeriodoLabel({
    dia: null, mes: mesEfetivo, ano,
    mesAtual: today.getMonth(), anoAtual: today.getFullYear(),
  })

  return (
    <div className="space-y-5">

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Análise Financeira Detalhada</h2>
        <p className="text-sm text-muted-foreground">
          {periodoLabel}
          {loading && <span className="ml-2 text-xs text-muted-foreground/60">carregando…</span>}
        </p>
      </div>

      <GlobalDateFilter
        month={mesEfetivo}
        year={ano}
        selectedDate={null}
        maxDate={new Date(anoAtual, mesAtual, today.getDate())}
        onMonthChange={handleMonthChange}
        onToday={handleToday}
        onDateSelect={handleDateSelect}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="gap-1 font-normal">
          <Database className="h-3 w-3" />
          FoneNinja + MeuAssessor
        </Badge>
        {fnBreakdown?.locked && (
          <Badge variant="outline" className="gap-1 font-normal text-amber-700 border-amber-300">
            <Lock className="h-3 w-3" />
            mês fechado
          </Badge>
        )}
        {isMesAtual && (
          <Badge variant="outline" className="gap-1 font-normal text-emerald-600 border-emerald-300 dark:border-emerald-700">
            <Radio className="h-3 w-3 animate-pulse" />
            ao vivo
          </Badge>
        )}
        {lastSync && (
          <span className="tabular-nums">
            Sync: {lastSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
        {refreshing && (
          <Badge variant="outline" className="gap-1 font-normal text-muted-foreground/70">
            <RefreshCw className="h-3 w-3 animate-spin" /> atualizando
          </Badge>
        )}
      </div>

      {isError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <CardContent className="px-4 py-3 text-sm text-red-800 dark:text-red-400">
            Não foi possível carregar o consolidado para este período.
          </CardContent>
        </Card>
      )}

      {/* 4 KPIs principais */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Faturamento do Mês"
          value={brl(revenue)}
          tooltip="Valor total vendido no período."
          trend="up"
          loading={loading}
          accent="blue"
        />
        <KpiCard
          label="Lucro Bruto"
          value={brl(grossProfit)}
          sub={`Margem ${pct(grossMargin)}`}
          tooltip={"Receita − CMV\n\nNão considera:\n- despesas administrativas\n- despesas operacionais\n- despesas fixas"}
          trend={grossProfit >= 0 ? "up" : "down"}
          loading={loading}
          accent={grossProfit >= 0 ? "green" : "red"}
        />
        <KpiCard
          label="Total de Gastos"
          value={brl(totalGastos)}
          tooltip={"Soma de:\n- despesas operacionais\n- despesas administrativas\n- despesas fixas\n\nCMV não incluso."}
          trend="down"
          loading={loading}
          accent="red"
        />
        <KpiCard
          label="Lucro Líquido"
          value={brl(lucroLiquido)}
          sub={revenue > 0 ? `Margem ${pct(liquidMargin)}` : undefined}
          tooltip={"Resultado final da operação.\n\nFórmula:\nLucro Bruto\n− Despesas Administrativas (MA)\n\nObservação: custos dos produtos (CMV) já estão descontados no Lucro Bruto."}
          trend={lucroLiquido >= 0 ? "up" : "down"}
          loading={loading}
          accent={lucroLiquido >= 0 ? "green" : "red"}
          emphasized
        />
      </div>

      {/* Composição do resultado */}
      {!loading && revenue > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Composição do resultado</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Faturamento",    valor: revenue },
                  { name: "Lucro Bruto",    valor: grossProfit },
                  { name: "Total Gastos",   valor: -totalGastos },
                  { name: "Lucro Líquido",  valor: lucroLiquido },
                ]}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => compact(Number(v))}
                />
                <Tooltip
                  formatter={(v) => brl(Number(v))}
                  contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                  cursor={{ fill: "transparent" }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {[revenue, grossProfit, -totalGastos, lucroLiquido].map((v, i) => (
                    <Cell key={i} fill={i === 2 ? "#ef4444" : v >= 0 ? "#22c55e" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top categorias de gastos */}
      {topCategorias.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Maiores gastos do período
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 text-left">
                    <th className="px-4 py-2 font-semibold">Categoria</th>
                    <th className="px-4 py-2 font-semibold text-right">Transações</th>
                    <th className="px-4 py-2 font-semibold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {topCategorias.map((c, i) => (
                    <tr key={`${c.categoria}-${i}`} className="border-t hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium">
                        {c.categoria}
                        {c.isTax && (
                          <Badge variant="outline" className="ml-2 text-[10px] font-normal text-amber-700 border-amber-300">
                            imposto
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{c.count}</td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums text-red-500">
                        {brl(c.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty/sanity --- */}
      {!loading && data && revenue === 0 && totalGastos === 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
          <CardContent className="px-4 py-3 text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Sem dados consolidados para este período.
          </CardContent>
        </Card>
      )}

    </div>
  )
}
