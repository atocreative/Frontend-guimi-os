"use client"

import useSWR from "swr"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle, TrendingUp, Users, Zap, Target, DollarSign,
  RefreshCw, CheckCircle2, Info, TrendingDown,
} from "lucide-react"
import type { ComercialBI, AlertaBI, VendedorBI, TemperaturaGrupo, EtapaIntelligence, OrigemROI } from "@/lib/services/comercial-bi"

// ─── Formatters ───────────────────────────────────────────────────────────────
const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(v)
const BRL_FULL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
const PCT = (v: number) => `${v}%`
const NUM = (v: number) => new Intl.NumberFormat("pt-BR").format(v)

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ─── Skeletons ────────────────────────────────────────────────────────────────
function KpiSkel() {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  )
}

// ─── Executive KPI Card ───────────────────────────────────────────────────────
function ExecKpi({
  label, value, sub, icon: Icon, risk,
}: {
  label: string
  value: string | null
  sub?: string
  icon: React.ElementType
  risk?: "danger" | "warning" | "success" | "neutral"
}) {
  const riskColor = {
    danger: "text-red-600",
    warning: "text-yellow-600",
    success: "text-emerald-600",
    neutral: "text-foreground",
  }[risk ?? "neutral"]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <p className={`text-xl font-bold tabular-nums ${riskColor}`}>
          {value ?? <span className="text-muted-foreground/40 text-base">—</span>}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Alerta ───────────────────────────────────────────────────────────────────
function AlertaItem({ a }: { a: AlertaBI }) {
  const cfg = {
    danger: { icon: AlertTriangle, cls: "text-red-500", bg: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900" },
    warning: { icon: AlertTriangle, cls: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900" },
    info: { icon: Info, cls: "text-blue-500", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900" },
    success: { icon: CheckCircle2, cls: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900" },
  }[a.tipo]
  const Icon = cfg.icon
  return (
    <div className={`flex gap-2 rounded-lg border p-3 ${cfg.bg}`}>
      <Icon className={`h-4 w-4 ${cfg.cls} shrink-0 mt-0.5`} />
      <div>
        <p className="text-xs font-semibold">{a.titulo}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{a.descricao}</p>
      </div>
    </div>
  )
}

// ─── ROI Chart ────────────────────────────────────────────────────────────────
function ROIChart({ origens }: { origens: OrigemROI[] }) {
  const data = origens.slice(0, 8).map((o) => ({
    name: o.origem.length > 12 ? o.origem.slice(0, 12) + "…" : o.origem,
    receita: o.receitaGerada,
    custo: o.custoEstimado,
    lucro: o.lucroEstimado,
    roi: o.roi,
  }))

  if (data.length === 0) return <p className="text-xs text-muted-foreground text-center py-6">Sem dados de origem</p>

  const melhor = origens.filter(o => o.roi > 0).sort((a, b) => b.roi - a.roi)[0]
  const pior = origens.filter(o => o.roi < 0).sort((a, b) => a.roi - b.roi)[0]

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {melhor && <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />Melhor ROI: {melhor.origem} ({PCT(melhor.roi)})
        </Badge>}
        {pior && <Badge variant="outline" className="text-red-600 bg-red-50 text-xs">
          <TrendingDown className="h-3 w-3 mr-1" />Pior: {pior.origem} ({PCT(pior.roi)})
        </Badge>}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => BRL(v)} tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: any, name: any) => [BRL_FULL(Number(v)), name === "receita" ? "Receita" : name === "custo" ? "Custo" : "Lucro"] as any} />
          <Bar dataKey="receita" fill="#3b82f6" radius={[0, 4, 4, 0]} name="receita" />
          <Bar dataKey="custo" fill="#f59e0b" radius={[0, 4, 4, 0]} name="custo" />
          <Bar dataKey="lucro" fill="#10b981" radius={[0, 4, 4, 0]} name="lucro" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-3 text-xs text-muted-foreground justify-center">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-500 inline-block"/>Receita</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-yellow-500 inline-block"/>Custo</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500 inline-block"/>Lucro</span>
      </div>
    </div>
  )
}

// ─── Forecast Chart ───────────────────────────────────────────────────────────
function ForecastChart({ points, confianca }: { points: ComercialBI["forecast"]; confianca: number | null }) {
  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <TrendingUp className="h-6 w-6 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">Forecast indisponível</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Configure o endpoint de forecast no backend</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {confianca !== null && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">Confiança: {confianca}%</Badge>
        </div>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={points} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => BRL(v)} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v: any) => BRL_FULL(Number(v)) as any} />
          <Line type="monotone" dataKey="receitaReal" stroke="#3b82f6" strokeWidth={2} name="Receita Real" dot={{ r: 3 }} />
          <Line type="monotone" dataKey="forecast30d" stroke="#10b981" strokeWidth={2} strokeDasharray="6 3" name="Forecast 30d" dot={{ r: 3 }} />
          <Line type="monotone" dataKey="forecast60d" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" name="Forecast 60d" dot={{ r: 3 }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Pipeline Intelligence ────────────────────────────────────────────────────
function PipelineIntelligence({ etapas, totais }: { etapas: EtapaIntelligence[]; totais: ComercialBI["totais"] }) {
  const gargalo = [...etapas].sort((a, b) => b.diasMedioParado - a.diasMedioParado)[0]
  return (
    <div className="space-y-3">
      {(totais.esquecidos > 0 || totais.semResponsavel > 0) && (
        <div className="flex gap-2 flex-wrap">
          {totais.esquecidos > 0 && (
            <Badge variant="outline" className="text-red-600 bg-red-50 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />{totais.esquecidos} esquecidos (+14d)
            </Badge>
          )}
          {totais.semResponsavel > 0 && (
            <Badge variant="outline" className="text-yellow-600 bg-yellow-50 text-xs">
              <Users className="h-3 w-3 mr-1" />{totais.semResponsavel} sem responsável
            </Badge>
          )}
          {gargalo && (
            <Badge variant="outline" className="text-orange-600 bg-orange-50 text-xs">
              <Zap className="h-3 w-3 mr-1" />Gargalo: {gargalo.label} ({gargalo.diasMedioParado}d)
            </Badge>
          )}
        </div>
      )}
      <div className="space-y-2">
        {etapas.map((e) => (
          <div key={e.etapa} className="flex items-center gap-3 py-2 border-b last:border-0">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{e.label}</span>
                <span className="text-xs text-muted-foreground">{e.quantidade} leads · {BRL(e.valor)}</span>
              </div>
              <div className="flex gap-4 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  Parado: <span className={e.diasMedioParado > 7 ? "text-red-500 font-medium" : ""}>{e.diasMedioParado}d</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Vendedores Ranking ────────────────────────────────────────────────────────
function VendedoresRankingBI({ vendedores }: { vendedores: VendedorBI[] }) {
  return (
    <div className="space-y-1">
      {vendedores.slice(0, 8).map((v, i) => (
        <div key={v.responsavel} className="flex items-center gap-3 py-2 border-b last:border-0">
          <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
            {v.responsavel.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium truncate">{v.responsavel}</span>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ml-2 ${v.taxaConversao >= 30 ? "text-emerald-700 bg-emerald-50" : v.taxaConversao >= 15 ? "text-yellow-700 bg-yellow-50" : "text-red-700 bg-red-50"}`}
              >
                {PCT(v.taxaConversao)} conv.
              </Badge>
            </div>
            <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
              <span className="text-emerald-600">{v.ganhos}↑ {BRL(v.valorGanho)}</span>
              <span className="text-red-500">{v.perdidos}↓ {BRL(v.valorPerdido)}</span>
              {v.semFollowUp > 0 && <span className="text-yellow-600">{v.semFollowUp} sem FU</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Temperatura ─────────────────────────────────────────────────────────────
function TemperaturaSection({ grupos }: { grupos: TemperaturaGrupo[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {grupos.map((g) => (
        <div key={g.temperatura} className="rounded-lg border p-3 text-center space-y-1">
          <p className="text-xl">{g.emoji}</p>
          <p className="text-xs font-semibold">{g.label}</p>
          <p className="text-lg font-bold tabular-nums">{NUM(g.quantidade)}</p>
          <p className="text-xs text-muted-foreground">{BRL(g.receitaPotencial)}</p>
          {g.diasMedioParado > 0 && (
            <p className={`text-xs ${g.diasMedioParado > 7 ? "text-red-500" : "text-muted-foreground"}`}>
              ~{g.diasMedioParado}d parado
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function BIDashboard() {
  const { data: bi, isLoading, error, mutate } = useSWR<ComercialBI>(
    "/api/comercial/bi",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000, errorRetryCount: 2 }
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <KpiSkel key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card><CardContent className="p-6"><Skeleton className="h-52 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-52 w-full" /></CardContent></Card>
        </div>
      </div>
    )
  }

  if (error || !bi || (bi as any).error) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-2">
          <AlertTriangle className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Dados BI indisponíveis.</p>
          <Button size="sm" variant="outline" onClick={() => mutate()}>
            <RefreshCw className="h-3 w-3 mr-1" />Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { kpis, origensRoi, etapas, vendedores, temperaturas, alertas, forecast, totais } = bi

  return (
    <div className="space-y-6">

      {/* ── Task 1: Executive KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <ExecKpi
          label="CAC Real"
          value={kpis.cac !== null ? BRL_FULL(kpis.cac) : null}
          sub={`por lead ganho`}
          icon={Target}
          risk={kpis.cac !== null && kpis.cac > 5000 ? "warning" : "neutral"}
        />
        <ExecKpi
          label="Margem Comercial"
          value={kpis.margemComercial !== null ? PCT(kpis.margemComercial) : null}
          sub="receita Kommo"
          icon={TrendingUp}
          risk={kpis.margemComercial !== null ? (kpis.margemComercial < 0 ? "danger" : kpis.margemComercial < 20 ? "warning" : "success") : "neutral"}
        />
        <ExecKpi
          label="Ticket Líquido"
          value={kpis.ticketMedioLiquido !== null ? BRL_FULL(kpis.ticketMedioLiquido) : null}
          sub="lucro / venda"
          icon={DollarSign}
          risk="neutral"
        />
        <ExecKpi
          label="Forecast 30d"
          value={kpis.forecast30d !== null ? BRL(kpis.forecast30d) : null}
          sub={kpis.confiancaForecast !== null ? `${kpis.confiancaForecast}% confiança` : "previsão"}
          icon={TrendingUp}
          risk="neutral"
        />
        <ExecKpi
          label="Forecast 60d"
          value={kpis.forecast60d !== null ? BRL(kpis.forecast60d) : null}
          sub="projeção"
          icon={TrendingUp}
          risk="neutral"
        />
        <ExecKpi
          label="Receita em Risco"
          value={BRL(kpis.receitaEmRisco)}
          sub="frios + parados >7d"
          icon={AlertTriangle}
          risk={kpis.receitaEmRisco > 10000 ? "danger" : kpis.receitaEmRisco > 0 ? "warning" : "neutral"}
        />
      </div>

      {/* ── Task 7: Temperatura ───────────────────────────────────────────── */}
      <TemperaturaSection grupos={temperaturas} />

      {/* ── Task 2+3: ROI Chart + Forecast ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />Origem × ROI
            </CardTitle>
          </CardHeader>
          <CardContent><ROIChart origens={origensRoi} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />Previsão de Fechamento
            </CardTitle>
          </CardHeader>
          <CardContent><ForecastChart points={forecast} confianca={kpis.confiancaForecast} /></CardContent>
        </Card>
      </div>

      {/* ── Task 4+5: Pipeline Intelligence + Alertas ─────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />Inteligência do Funil
            </CardTitle>
          </CardHeader>
          <CardContent><PipelineIntelligence etapas={etapas} totais={totais} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />Alertas Financeiros
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => mutate()}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertas.length === 0
              ? <p className="text-xs text-muted-foreground text-center py-4">Nenhum alerta ativo.</p>
              : alertas.map((a, i) => <AlertaItem key={i} a={a} />)
            }
          </CardContent>
        </Card>
      </div>

      {/* ── Task 6: Vendedores ────────────────────────────────────────────── */}
      {vendedores.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />Produtividade da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent><VendedoresRankingBI vendedores={vendedores} /></CardContent>
        </Card>
      )}

    </div>
  )
}
