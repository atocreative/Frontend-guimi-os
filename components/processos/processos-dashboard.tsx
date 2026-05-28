"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  Radio,
  Database,
  Wallet,
  PieChart as PieIcon,
  TrendingDown,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { GlobalDateFilter } from "@/components/global/global-date-filter"
import { getPeriodoLabel } from "@/lib/financeiro-utils"
import {
  useProcessosDespesasMensais,
  useProcessosSaldoHistorico,
  type ProcessosDespesaItem,
} from "@/lib/queries/use-processos-financeiros"

const PALETA = [
  "#ef4444","#f97316","#f59e0b","#eab308","#84cc16",
  "#22c55e","#06b6d4","#3b82f6","#6366f1","#8b5cf6",
  "#ec4899","#64748b",
]

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(valor) ? valor : 0)
}

function mesAnterior(mes: number, ano: number) {
  return mes === 0 ? { mes: 11, ano: ano - 1 } : { mes: mes - 1, ano }
}

interface GrupoCategoria {
  categoria: string
  abs: number
  signed: number
  count: number
}

function agrupar(items: ProcessosDespesaItem[]): {
  total: number
  totalAbs: number
  grupos: GrupoCategoria[]
  semCategoria: number
} {
  const map = new Map<string, { abs: number; count: number }>()
  let semCategoria = 0

  for (const item of items) {
    const abs = Math.abs(item.amount)
    if (!abs) continue
    const cat = item.categoria
    if (cat === "Não classificado" || cat === "Outros") semCategoria += Number(item.count ?? 1)
    const prev = map.get(cat) ?? { abs: 0, count: 0 }
    map.set(cat, { abs: prev.abs + abs, count: prev.count + Number(item.count ?? 1) })
  }

  const grupos: GrupoCategoria[] = Array.from(map.entries())
    .map(([categoria, v]) => ({ categoria, abs: v.abs, signed: -v.abs, count: v.count }))
    .sort((a, b) => b.abs - a.abs)

  const totalAbs = grupos.reduce((s, g) => s + g.abs, 0)
  return { total: -totalAbs, totalAbs, grupos, semCategoria }
}

interface Alerta { tipo: "warning" | "success" | "info"; mensagem: string }

function gerarAlertas(
  aggAtual: ReturnType<typeof agrupar>,
  aggAnterior: ReturnType<typeof agrupar>,
  maxAlertas = 4,
): Alerta[] {
  const cand: Array<Alerta & { score: number }> = []
  const ctx = "vs mês anterior"
  const prevAbs = aggAnterior.totalAbs

  if (prevAbs > 0) {
    const delta = ((aggAtual.totalAbs - prevAbs) / prevAbs) * 100
    if (Math.abs(delta) >= 10) {
      cand.push({
        tipo: delta > 0 ? "warning" : "success",
        score: 200 + Math.abs(delta),
        mensagem: delta > 0
          ? `Despesas ↑ ${delta.toFixed(0)}% ${ctx} (${brl(aggAtual.totalAbs)})`
          : `Despesas ↓ ${Math.abs(delta).toFixed(0)}% ${ctx} (${brl(aggAtual.totalAbs)})`,
      })
    }
  }

  if (aggAtual.totalAbs > 0) {
    for (const g of aggAtual.grupos.slice(0, 3)) {
      const peso = (g.abs / aggAtual.totalAbs) * 100
      if (peso >= 35) {
        cand.push({
          tipo: "warning",
          score: 150 + peso,
          mensagem: `${g.categoria} concentra ${peso.toFixed(0)}% do gasto (${brl(g.abs)})`,
        })
      }
    }
  }

  const prevMap = new Map(aggAnterior.grupos.map((g) => [g.categoria, g.abs]))
  for (const g of aggAtual.grupos) {
    const prev = prevMap.get(g.categoria) ?? 0
    if (prev <= 0) continue
    const delta = ((g.abs - prev) / prev) * 100
    if (Math.abs(delta) >= 50) {
      cand.push({
        tipo: delta > 0 ? "warning" : "info",
        score: 120 + Math.abs(delta) * 0.5,
        mensagem: delta > 0
          ? `${g.categoria} ↑ ${delta.toFixed(0)}% ${ctx}`
          : `${g.categoria} ↓ ${Math.abs(delta).toFixed(0)}% ${ctx}`,
      })
    }
  }

  if (aggAtual.semCategoria > 0) {
    cand.push({
      tipo: "info",
      score: 50,
      mensagem: `${aggAtual.semCategoria} despesa${aggAtual.semCategoria > 1 ? "s" : ""} sem classificação — revisar no MeuAssessor`,
    })
  }

  return cand.sort((a, b) => b.score - a.score).slice(0, maxAlertas)
}

interface Props {
  initialSummary?: unknown   // aceito mas ignorado — domínio comercial
  initialMes: number
  initialAno: number
  availableYears: number[]
}

export function ProcessosDashboard({ initialMes, initialAno }: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const today        = new Date()
  const mesAtual     = initialMes
  const anoAtual     = initialAno

  const [mes, setMes] = useState(() => {
    const raw = searchParams.get("m")
    const m   = raw !== null ? Number(raw) : NaN
    return !isNaN(m) && m >= 0 && m <= 11 ? m : initialMes
  })
  const [ano, setAno] = useState(() => {
    const y = Number(searchParams.get("y"))
    return y >= 2024 ? y : initialAno
  })

  const maxMes      = ano === anoAtual ? mesAtual : 11
  const mesEfetivo  = Math.min(mes, maxMes)
  const month1      = mesEfetivo + 1
  const { mes: prevMesIdx, ano: prevAnoN } = mesAnterior(mesEfetivo, ano)

  const syncUrl = useCallback(
    (m: number, a: number) => {
      const p = new URLSearchParams()
      p.set("m", String(m))
      p.set("y", String(a))
      router.replace(`/processos?${p.toString()}`, { scroll: false })
    },
    [router],
  )

  const mensal    = useProcessosDespesasMensais(ano, month1)
  const anterior  = useProcessosDespesasMensais(prevAnoN, prevMesIdx + 1)
  const historico = useProcessosSaldoHistorico(ano, month1, 5)

  const loadingMes  = mensal.isLoading  && !mensal.data
  const loadingHist = historico.isLoading && historico.data.length === 0
  const refreshingMes = mensal.isFetching  && !loadingMes

  const lastSyncTs = mensal.dataUpdatedAt ?? 0
  const lastSync   = lastSyncTs > 0 ? new Date(lastSyncTs) : null

  const isMesAtual = mesEfetivo === today.getMonth() && ano === today.getFullYear()

  const aggAtual    = useMemo(() => agrupar(mensal.data?.items ?? []),   [mensal.data])
  const aggAnterior = useMemo(() => agrupar(anterior.data?.items ?? []), [anterior.data])

  const categorias = useMemo(
    () => aggAtual.grupos.map((g, i) => ({
      categoria: g.categoria,
      valorAbs : g.abs,
      valor    : g.signed,
      count    : g.count,
      cor      : PALETA[i % PALETA.length],
    })),
    [aggAtual],
  )

  const rowsExibidas = mensal.data?.items ?? []

  const alertas = useMemo(
    () => gerarAlertas(aggAtual, aggAnterior),
    [aggAtual, aggAnterior],
  )

  const handleMonthChange = useCallback((m: number, y: number) => {
    setMes(m); setAno(y)
    syncUrl(m, y)
  }, [syncUrl])

  const handleToday = useCallback(() => {
    const now = new Date()
    setMes(now.getMonth()); setAno(now.getFullYear())
    syncUrl(now.getMonth(), now.getFullYear())
  }, [syncUrl])

  // Backend não suporta filtro de dia — preserva apenas mês/ano
  const handleDateSelect = useCallback((date: Date | null) => {
    if (!date) return
    setMes(date.getMonth()); setAno(date.getFullYear())
    syncUrl(date.getMonth(), date.getFullYear())
  }, [syncUrl])

  const periodoLabel = getPeriodoLabel({
    dia: null, mes: mesEfetivo, ano,
    mesAtual: today.getMonth(), anoAtual: today.getFullYear(),
  })
  const erro = mensal.isError

  return (
    <div className="space-y-5">

      <div>
        <h2 className="text-xl font-semibold">Despesas Administrativas</h2>
        <p className="text-sm text-muted-foreground">
          {periodoLabel}
          {loadingMes && <span className="ml-2 text-xs text-muted-foreground/60">carregando…</span>}
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
          MeuAssessor
        </Badge>
        {isMesAtual && (
          <Badge variant="outline" className="gap-1 font-normal text-emerald-600 border-emerald-300 dark:border-emerald-700">
            <Radio className="h-3 w-3 animate-pulse" />
            Realtime · 30s
          </Badge>
        )}
        {lastSync && (
          <span className="tabular-nums">
            Sync:{" "}
            {lastSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
        {refreshingMes && (
          <Badge variant="outline" className="gap-1 font-normal text-muted-foreground/70">
            <RefreshCw className="h-3 w-3 animate-spin" /> mês
          </Badge>
        )}
        <span className="ml-auto tabular-nums">
          {rowsExibidas.length} categoria{rowsExibidas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {erro && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <CardContent className="px-4 py-3 text-sm text-red-800 dark:text-red-400">
            Não foi possível carregar despesas para este período.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total Despesas do Mês
              </p>
              <TrendingDown className="h-4 w-4 text-red-400" />
            </div>
            {loadingMes ? (
              <Skeleton className="h-8 w-32 rounded" />
            ) : (
              <p className="text-2xl font-bold tabular-nums text-red-500">
                {brl(aggAtual.total)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {aggAtual.grupos.length} categoria{aggAtual.grupos.length !== 1 ? "s" : ""}
              {aggAtual.semCategoria > 0 && (
                <span className="ml-1 text-amber-500">
                  · {aggAtual.semCategoria} sem classificação
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Maior Categoria
              </p>
              <PieIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            {loadingMes ? (
              <Skeleton className="h-8 w-40 rounded" />
            ) : aggAtual.grupos.length > 0 ? (
              <>
                <p className="text-lg font-bold truncate">{aggAtual.grupos[0].categoria}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {brl(aggAtual.grupos[0].abs)}{" "}
                  <span className="text-muted-foreground/60">
                    ({aggAtual.totalAbs > 0 ? ((aggAtual.grupos[0].abs / aggAtual.totalAbs) * 100).toFixed(0) : 0}% do total)
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alertas Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {loadingMes ? (
            <div className="flex gap-2 w-full">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 flex-1 rounded-md" />
            </div>
          ) : alertas.length === 0 ? (
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
                  className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs leading-snug flex-1 min-w-[220px] ${
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Saldo Administrativo — últimos 5 meses
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              entradas − despesas (MeuAssessor)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          {loadingHist ? (
            <Skeleton className="h-full w-full rounded-md" />
          ) : historico.data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Sem dados históricos.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historico.data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) =>
                    new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(Number(v))
                  }
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Tooltip
                  formatter={(v) => brl(Number(v))}
                  contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                  cursor={{ fill: "transparent" }}
                />
                <Bar dataKey="saldo" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {historico.data.map((d, i) => (
                    <Cell key={i} fill={d.saldo >= 0 ? "#22c55e" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-muted-foreground" />
            Despesas por Categoria
            <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
              Total: {brl(aggAtual.total)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          {loadingMes ? (
            <Skeleton className="h-[220px] w-full rounded-md" />
          ) : categorias.length === 0 ? (
            <div className="flex h-[160px] w-full items-center justify-center text-xs text-muted-foreground">
              Nenhuma despesa no período.
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categorias}
                      dataKey="valorAbs"
                      nameKey="categoria"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={36}
                      isAnimationActive={false}
                      label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                      labelLine={false}
                    >
                      {categorias.map((d, i) => (
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
              </div>

              <div className="flex flex-col justify-center gap-2 min-w-[180px]">
                {categorias.map((item) => (
                  <div key={item.categoria} className="flex items-center justify-between text-xs gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ background: item.cor }}
                      />
                      {item.categoria}
                    </span>
                    <span className="font-medium tabular-nums text-red-500 shrink-0">
                      {brl(item.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Despesas MeuAssessor por categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingMes ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded" />
              ))}
            </div>
          ) : rowsExibidas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma despesa encontrada.</p>
            </div>
          ) : (
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
                  {rowsExibidas.slice(0, 50).map((item, i) => (
                    <tr key={String(item.id ?? i)} className="border-t hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium">{item.categoria}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {item.count}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums text-red-500">
                        {brl(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rowsExibidas.length > 50 && (
                <p className="px-4 py-2 text-xs text-muted-foreground">
                  Exibindo 50 de {rowsExibidas.length} registros.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
