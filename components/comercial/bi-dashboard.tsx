"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Tooltip as UiTooltip,
  TooltipContent as UiTooltipContent,
  TooltipProvider as UiTooltipProvider,
  TooltipTrigger as UiTooltipTrigger,
} from "@/components/ui/tooltip"
import { GlobalDateFilter } from "@/components/global/global-date-filter"
import { cn } from "@/lib/utils"
import {
  AlertTriangle, TrendingUp, TrendingDown, Users, Zap,
  RefreshCw, CheckCircle2, Info, ShieldAlert,
  Clock, UserX, BarChart2,
  XCircle, MessageCircle,
  ExternalLink, Percent, Activity, Award, ArrowRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type {
  ComercialBI, ScorePenalty, PipelineStage, FonteLead, KPIs,
} from "@/lib/services/comercial-bi"
import type { ComercialHistory } from "@/lib/services/comercial-history.service"
import { buildHistoryUrl } from "@/lib/services/comercial-history.service"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ND = "N/D"
const fmtInt = new Intl.NumberFormat("pt-BR")

function nfn(v: number | null | undefined, suffix = ""): string {
  if (v === null || v === undefined || !Number.isFinite(v as number)) return ND
  return fmtInt.format(v) + suffix
}

function timeFmt(min: number | null | undefined): string {
  if (min === null || min === undefined || !Number.isFinite(min as number)) return ND
  if (min <= 0) return ND
  if (min >= 60) {
    const h = Math.floor(min / 60)
    const m = Math.round(min % 60)
    return m > 0 ? `${h}h${m}min` : `${h}h`
  }
  return `${Math.round(min)}min`
}

function pctFmt(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v as number)) return ND
  return `${(v as number).toFixed(0)}%`
}

const fetcher = async (url: string) => {
  const r = await fetch(url)
  const json = await r.json()
  if (!r.ok || "error" in json) throw new Error(json?.error ?? `HTTP ${r.status}`)
  return json
}

// ─── Stage label mapping ─────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  novo_contato:     "Prospectiva",
  prospeccao:       "Prospectiva",
  qualificacao:     "Qualificação",
  qualificado:      "Qualificação",
  em_negociacao:    "Negociação",
  negociacao:       "Negociação",
  proposta:         "Negociação",
  proposta_enviada: "Negociação",
  fechamento:       "Fechamento",
}

function prettyStage(label: string, stage: string): string {
  const key = (stage || label).toLowerCase().replace(/\s+/g, "_")
  return STAGE_LABELS[key] ?? (label || stage || "—")
}

// ─── KPI tile ─────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  size?: "lg" | "sm"
  accent?: "amber" | "red" | "emerald"
  /** Structured tooltip: "O que é\n\nFórmula: ...\n\nOrigem: ..." */
  tooltip?: string
}

function KpiTile({ label, value, hint, icon: Icon, size = "lg", accent, tooltip }: KpiProps) {
  const isND = value === ND
  return (
    <Card className={cn(
      "transition-shadow hover:shadow-md",
      accent === "red"     && "ring-1 ring-red-200/70 dark:ring-red-900/60",
      accent === "amber"   && "ring-1 ring-amber-200/70 dark:ring-amber-900/60",
      accent === "emerald" && "ring-1 ring-emerald-200/70 dark:ring-emerald-900/60",
    )}>
      <CardContent className={cn(size === "lg" ? "p-5" : "p-4")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                {label}
              </p>
              {tooltip && (
                <UiTooltipProvider>
                  <UiTooltip>
                    <UiTooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Sobre ${label}`}
                        className="rounded-full p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors focus:outline-none shrink-0"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </UiTooltipTrigger>
                    <UiTooltipContent side="top" className="max-w-[260px] whitespace-pre-line text-xs leading-snug">
                      {tooltip}
                    </UiTooltipContent>
                  </UiTooltip>
                </UiTooltipProvider>
              )}
            </div>
            <p className={cn(
              "mt-1 font-bold tracking-tight tabular-nums",
              size === "lg" ? "text-3xl" : "text-2xl",
              isND ? "text-muted-foreground/60" : "text-foreground",
            )}>
              {value}
            </p>
            {hint && (
              <p className="mt-1 text-[11px] text-muted-foreground truncate">{hint}</p>
            )}
          </div>
          <div className="rounded-md p-1.5 shrink-0 bg-muted/60">
            <Icon className={cn(
              "h-4 w-4",
              accent === "red"     ? "text-red-500 dark:text-red-400" :
              accent === "amber"   ? "text-amber-500 dark:text-amber-400" :
              accent === "emerald" ? "text-emerald-500 dark:text-emerald-400" :
              "text-muted-foreground",
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Alert types ──────────────────────────────────────────────────────────────

type AlertSev = "critical" | "warning" | "info"
interface OpAlert { id: string; sev: AlertSev; title: string; description: string }

const SEV_META: Record<AlertSev, { icon: React.ElementType; row: string; iconCn: string; badge: string; label: string }> = {
  critical: { icon: ShieldAlert,    row: "border-red-500/40 bg-red-500/10",       iconCn: "text-red-500",    badge: "bg-red-500/20 text-red-400 border-red-500/30",       label: "Crítico" },
  warning:  { icon: AlertTriangle,  row: "border-yellow-500/40 bg-yellow-500/10", iconCn: "text-yellow-500", badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Atenção" },
  info:     { icon: Info,           row: "border-blue-500/30 bg-blue-500/8",      iconCn: "text-blue-400",   badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",     label: "Info" },
}

const SEV_EMOJI: Record<AlertSev, string> = { critical: "🔴", warning: "🟡", info: "🟢" }

function CentroDeAtencaoPanel({ alerts }: { alerts: OpAlert[] }) {
  if (alerts.length === 0) return null
  const critical = alerts.filter(a => a.sev === "critical").length
  const warnings = alerts.filter(a => a.sev === "warning").length

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            Centro de Atenção
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {critical > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-semibold bg-red-500/20 text-red-400 border-red-500/30">
                {critical} crítico{critical > 1 ? "s" : ""}
              </Badge>
            )}
            {warnings > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {warnings} atenção
              </Badge>
            )}
            {critical === 0 && warnings === 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                operacional saudável
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[260px] overflow-y-auto px-4 pb-4 space-y-1.5 pt-1">
          {alerts.slice(0, 10).map((a) => {
            const meta = SEV_META[a.sev]
            const Icon = meta.icon
            return (
              <div key={a.id} className={cn("flex items-start gap-2.5 rounded-lg border px-3 py-2", meta.row)}>
                <span className="shrink-0 mt-0.5 text-sm leading-none">{SEV_EMOJI[a.sev]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-tight">{a.title}</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground mt-0.5">{a.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Evolução temporal — AreaChart ───────────────────────────────────────────

function fmtTick(iso: string, granularity: "dia" | "mes"): string {
  if (granularity === "mes" && /^\d{4}-\d{2}/.test(iso)) {
    const [y, m] = iso.split("-")
    return `${m}/${y.slice(2)}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
  }
  return iso
}

function EvolucaoCard({ history, periodoLabel }: { history: ComercialHistory | undefined; periodoLabel: string }) {
  if (process.env.NODE_ENV !== "production" && history) {
    console.log("[HistoryChart]", history)
  }

  const data = useMemo(() => {
    if (!history) return []
    return history.points.map((p) => ({
      label: fmtTick(p.date, history.granularity),
      Ativos:   p.leadsAtivos,
      Ganhos:   p.leadsGanhos,
      Perdidos: p.leadsPerdidos,
    }))
  }, [history])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Evolução de Leads
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">{periodoLabel}</span>
        </div>
      </CardHeader>
      <CardContent>
        {!history ? (
          <Skeleton className="h-[240px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <BarChart2 className="h-6 w-6 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Sem histórico para este período.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-ativos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="grad-ganhos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="grad-perdidos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} vertical={false} />
              <XAxis
                dataKey="label" tickLine={false} axisLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                tickLine={false} axisLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-muted-foreground"
                allowDecimals={false}
                width={40}
              />
              <RechartsTooltip
                cursor={{ stroke: "currentColor", strokeOpacity: 0.15 }}
                contentStyle={{
                  fontSize: 11, borderRadius: 8,
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Area type="monotone" dataKey="Ativos"   stroke="#3b82f6" strokeWidth={2} fill="url(#grad-ativos)"   />
              <Area type="monotone" dataKey="Ganhos"   stroke="#10b981" strokeWidth={2} fill="url(#grad-ganhos)"   />
              <Area type="monotone" dataKey="Perdidos" stroke="#ef4444" strokeWidth={2} fill="url(#grad-perdidos)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Origem dos leads — Pie + legend ──────────────────────────────────────────

const ORIGEM_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#64748b"]

function OrigemCard({ fontes }: { fontes: FonteLead[] }) {
  const top = [...fontes].sort((a, b) => b.quantidade - a.quantidade).slice(0, 6)
  const data = top.map((f, i) => ({
    name: f.origem.length > 18 ? f.origem.slice(0, 18) + "…" : f.origem,
    value: f.quantidade,
    color: ORIGEM_COLORS[i % ORIGEM_COLORS.length],
  }))
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Origem dos Leads
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <BarChart2 className="h-6 w-6 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Sem fontes registradas.</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={200} minWidth={140} className="!flex-1">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                  {data.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    fontSize: 11, borderRadius: 8,
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-1.5 text-xs min-w-0 w-full">
              {data.map((d, i) => {
                const pct = total ? Math.round((d.value / total) * 100) : 0
                return (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: d.color }} />
                    <span className="text-muted-foreground truncate flex-1">{d.name}</span>
                    <span className="tabular-nums text-foreground font-medium">{fmtInt.format(d.value)}</span>
                    <span className="tabular-nums text-muted-foreground w-9 text-right">{pct}%</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Pipeline kanban ─────────────────────────────────────────────────────────

function PipelineKanbanCard({
  stages, semResponsavel, esquecidos,
}: {
  stages: PipelineStage[]
  semResponsavel: number
  esquecidos: number
}) {
  const total = stages.reduce((s, x) => s + x.leads, 0)
  const agingTone = (dias: number) =>
    dias <= 7  ? { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" } :
    dias <= 14 ? { bar: "bg-amber-400",   text: "text-amber-600  dark:text-amber-400"   } :
                 { bar: "bg-red-500",     text: "text-red-600    dark:text-red-400"     }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 flex-wrap gap-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          Pipeline
          <Badge variant="secondary" className="text-[10px] font-medium tabular-nums">
            {fmtInt.format(total)} leads
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-1.5 flex-wrap">
          {esquecidos > 0 && (
            <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400 text-[10px]">
              <Clock className="h-3 w-3 mr-1" />{esquecidos} esquecidos
            </Badge>
          )}
          {semResponsavel > 0 && (
            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900 dark:text-amber-400 text-[10px]">
              <UserX className="h-3 w-3 mr-1" />{semResponsavel} sem owner
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {stages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <BarChart2 className="h-6 w-6 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Nenhum lead ativo neste período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="grid gap-3 min-w-[640px]"
                 style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
              {stages.map((s, i) => {
                const tone = agingTone(s.avgDiasEtapa)
                const pct = total ? Math.round((s.leads / total) * 100) : 0
                const barW = Math.max(pct, 3)
                const label = prettyStage(s.label, s.stage)
                return (
                  <div key={`${s.stage}-${i}`}
                       className="rounded-lg border border-border bg-card/50 p-3 space-y-2 hover:bg-card transition-colors">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                      {label}
                    </p>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                        {fmtInt.format(s.leads)}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">{pct}%</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-1.5 rounded-full transition-all", tone.bar)} style={{ width: `${barW}%` }} />
                    </div>
                    <p className={cn("text-[11px] flex items-center gap-1", tone.text)}>
                      <Clock className="h-3 w-3" />{s.avgDiasEtapa}d em média
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── IA Insights Comerciais ───────────────────────────────────────────────────

type InsightItem = { text: string; score: number; type: "positive" | "warning" | "info" }

function computeInsights(kpis: KPIs, fontes: FonteLead[]): InsightItem[] {
  const out: InsightItem[] = []
  const total = (kpis.leadsAtivos ?? 0) + (kpis.leadsGanhos ?? 0) + (kpis.leadsPerdidos ?? 0)
  const sortedByQtd  = [...fontes].sort((a, b) => b.quantidade - a.quantidade)
  const sortedByConv = [...fontes].filter(f => f.quantidade >= 3).sort((a, b) => (b.ganhos / b.quantidade) - (a.ganhos / a.quantidade))

  // Canal high volume + low conversion
  for (const f of sortedByQtd) {
    if (total > 0 && f.quantidade / total > 0.20 && f.ganhos / f.quantidade < 0.10) {
      out.push({ text: `${f.origem} gera volume mas não gera vendas — ${Math.round(f.quantidade / total * 100)}% dos leads, apenas ${pctFmt(f.ganhos / f.quantidade * 100)} de conversão.`, score: 95, type: "warning" })
      break
    }
  }

  // Melhor ROI comercial
  if (sortedByConv[0] && sortedByConv[0].ganhos > 0) {
    const best = sortedByConv[0]
    out.push({ text: `${best.origem} possui melhor ROI comercial — ${pctFmt(best.ganhos / best.quantidade * 100)} de conversão.`, score: 85, type: "positive" })
  }

  // Comparativo canais
  if (sortedByConv.length >= 2) {
    const best  = sortedByConv[0]
    const worst = sortedByConv[sortedByConv.length - 1]
    const bConv = best.ganhos / best.quantidade
    const wConv = worst.ganhos / worst.quantidade
    if (bConv > 0 && wConv > 0 && bConv > wConv * 2) {
      out.push({ text: `${best.origem} converte ${(bConv / wConv).toFixed(1)}× mais que ${worst.origem}.`, score: 80, type: "positive" })
    }
  }

  // Conversão geral
  if (kpis.taxaConversao != null) {
    if (kpis.taxaConversao < 10)
      out.push({ text: `Conversão em ${pctFmt(kpis.taxaConversao)} — abaixo da meta de 20%. Revisar qualificação ou abordagem.`, score: 75, type: "warning" })
    else if (kpis.taxaConversao >= 20)
      out.push({ text: `Conversão em ${pctFmt(kpis.taxaConversao)} — meta atingida.`, score: 70, type: "positive" })
  }

  // Chats aguardando
  if (kpis.chatsSemResposta != null && kpis.chatsSemResposta > 0)
    out.push({ text: `Equipe possui ${fmtInt.format(kpis.chatsSemResposta)} conversas aguardando resposta.`, score: 65, type: kpis.chatsSemResposta >= 50 ? "warning" : "info" })

  // Leads sem ação
  if (kpis.esquecidos != null && kpis.esquecidos > 0)
    out.push({ text: `${fmtInt.format(kpis.esquecidos)} leads sem interação recente — risco de churn.`, score: 60, type: "warning" })

  return out.sort((a, b) => b.score - a.score).slice(0, 5)
}

const INSIGHT_STYLE = {
  positive: { bg: "bg-emerald-50/70 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200/50 dark:border-emerald-800/30", Icon: TrendingUp, iconCn: "text-emerald-500" },
  warning:  { bg: "bg-amber-50/70 dark:bg-amber-950/20",   text: "text-amber-700 dark:text-amber-300",   border: "border-amber-200/50 dark:border-amber-800/30",   Icon: AlertTriangle, iconCn: "text-amber-500" },
  info:     { bg: "bg-blue-50/60 dark:bg-blue-950/20",     text: "text-blue-700 dark:text-blue-300",     border: "border-blue-200/40 dark:border-blue-800/20",     Icon: Info,          iconCn: "text-blue-400" },
}

function InsightsComerciaisCard({ kpis, fontes }: { kpis: KPIs; fontes: FonteLead[] }) {
  const insights = useMemo(() => computeInsights(kpis, fontes), [kpis, fontes])
  if (insights.length === 0) return null
  return (
    <Card className="border-blue-200/40 dark:border-blue-800/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" />
          IA Comercial
          <span className="ml-auto text-[11px] font-normal text-muted-foreground">{insights.length} insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {insights.map((ins, i) => {
          const s = INSIGHT_STYLE[ins.type]
          const Icon = s.Icon
          return (
            <div key={i} className={cn("flex items-start gap-2.5 rounded-md border px-3 py-2", s.bg, s.border)}>
              <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", s.iconCn)} />
              <p className={cn("text-xs leading-snug", s.text)}>{ins.text}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ─── Funil Visual ─────────────────────────────────────────────────────────────

function FunilVisualCard({ stages, ganhos }: { stages: PipelineStage[]; ganhos: number | null }) {
  const funilStages = useMemo(() => {
    const all = [...stages]
    if (ganhos !== null && ganhos >= 0)
      all.push({ stage: "fechado_ganho", label: "Ganhos", leads: ganhos, avgDiasEtapa: 0 })
    return all
  }, [stages, ganhos])

  const maxLeads = Math.max(...funilStages.map(s => s.leads), 1)
  if (funilStages.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          Funil de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {funilStages.map((stage, i) => {
          const prev        = funilStages[i - 1]
          const pctOfMax    = (stage.leads / maxLeads) * 100
          const passRate    = prev && prev.leads > 0 ? Math.round((stage.leads / prev.leads) * 100) : null
          const isGanhos    = stage.stage === "fechado_ganho"
          const isLow       = passRate !== null && passRate < 20
          const label       = isGanhos ? "Ganhos" : prettyStage(stage.label, stage.stage)
          return (
            <div key={stage.stage}>
              {passRate !== null && (
                <div className="flex items-center gap-2 my-0.5 pl-28">
                  <span className={cn("text-[11px] font-medium tabular-nums", isLow ? "text-rose-500" : "text-muted-foreground")}>
                    ↓ {passRate}%{isLow ? " — gargalo" : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-24 shrink-0 text-right truncate">{label}</span>
                <div className="flex-1 h-5 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", isGanhos ? "bg-emerald-500" : "bg-blue-500")}
                    style={{ width: `${Math.max(pctOfMax, 2)}%` }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums w-10 shrink-0 text-right">{fmtInt.format(stage.leads)}</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ─── Ranking de Canais ─────────────────────────────────────────────────────────

type CanaisSortKey = "quantidade" | "ganhos" | "conversao"

function RankingCanaisCard({ fontes }: { fontes: FonteLead[] }) {
  const [sortBy, setSortBy] = useState<CanaisSortKey>("quantidade")

  const rows = useMemo(() => {
    return [...fontes]
      .filter(f => f.quantidade > 0)
      .map(f => ({ ...f, conversao: f.quantidade > 0 ? (f.ganhos / f.quantidade) * 100 : 0 }))
      .sort((a, b) => {
        if (sortBy === "quantidade") return b.quantidade - a.quantidade
        if (sortBy === "ganhos")    return b.ganhos    - a.ganhos
        return b.conversao - a.conversao
      })
  }, [fontes, sortBy])

  if (rows.length === 0) return null

  const perfCn    = (c: number) => c >= 20 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : c >= 10 ? "text-amber-600 dark:text-amber-400" : "text-rose-500"
  const perfLabel = (c: number) => c >= 20 ? "Ótimo" : c >= 10 ? "Regular" : "Baixo"

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Ranking de Canais
          </CardTitle>
          <div className="flex gap-1">
            {(["quantidade", "ganhos", "conversao"] as const).map(k => (
              <button
                key={k}
                onClick={() => setSortBy(k)}
                className={cn("px-2 py-0.5 rounded text-[11px] font-medium border transition-colors",
                  sortBy === k
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:border-border"
                )}
              >
                {k === "quantidade" ? "Leads" : k === "ganhos" ? "Ganhos" : "Conversão"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Canal</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Leads</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Ganhos</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Conversão</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Performance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.origem} className={cn("border-b border-border/30 last:border-0", i === 0 && sortBy === "conversao" && "bg-emerald-50/30 dark:bg-emerald-950/10")}>
                  <td className="px-4 py-2.5 font-medium">{r.origem}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtInt.format(r.quantidade)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{fmtInt.format(r.ganhos)}</td>
                  <td className={cn("px-4 py-2.5 text-right tabular-nums", perfCn(r.conversao))}>{pctFmt(r.conversao)}</td>
                  <td className={cn("px-4 py-2.5 text-right", perfCn(r.conversao))}>{perfLabel(r.conversao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Alertas Unificados (Centro de Atenção) ────────────────────────────────────

function computeTodosAlertas(kpis: KPIs, fontes: FonteLead[], backend: ScorePenalty[]): OpAlert[] {
  const out: OpAlert[] = []
  const SEV_SCORE: Record<AlertSev, number> = { critical: 100, warning: 50, info: 10 }

  // ── Operacional ──────────────────────────────────────────────────────────────
  const chats = kpis.chatsSemResposta
  const tresp = kpis.tempoRespostaMedio
  const esq   = kpis.esquecidos
  const sown  = kpis.semResponsavel
  const stask = kpis.leadsSemTarefa
  const conv  = kpis.taxaConversao

  if (chats != null && chats >= 100) out.push({ id: "chats-critical", sev: "critical", title: "Muitos chats sem resposta", description: `${fmtInt.format(chats)} chats aguardando a equipe.` })
  else if (chats != null && chats >= 30) out.push({ id: "chats-warn", sev: "warning", title: "Chats sem resposta acumulando", description: `${fmtInt.format(chats)} chats pendentes.` })

  if (tresp != null && tresp >= 60) out.push({ id: "tresp-critical", sev: "critical", title: "Tempo de resposta crítico", description: `${timeFmt(tresp)} de média — meta < 30min.` })
  else if (tresp != null && tresp >= 30) out.push({ id: "tresp-warn", sev: "warning", title: "Tempo de resposta alto", description: `${timeFmt(tresp)} de média — meta < 30min.` })

  if (esq != null && esq > 0) out.push({ id: "esquec", sev: "critical", title: "Leads esquecidos", description: `${fmtInt.format(esq)} leads sem interação recente.` })
  if (sown != null && sown > 0) out.push({ id: "sown", sev: "warning", title: "Leads sem responsável", description: `${fmtInt.format(sown)} leads aguardando owner.` })
  if (stask != null && stask >= 10) out.push({ id: "stask", sev: "warning", title: "Leads sem follow-up", description: `${fmtInt.format(stask)} leads sem tarefa agendada.` })
  if (conv != null && conv < 5) out.push({ id: "conv-low", sev: "warning", title: "Conversão abaixo da média histórica", description: `Taxa atual em ${pctFmt(conv)} — meta 20%.` })

  // ── Canais ───────────────────────────────────────────────────────────────────
  const totalFontes = fontes.reduce((s, f) => s + f.quantidade, 0)
  for (const f of fontes) {
    if (f.quantidade < 3) continue
    const cconv = f.ganhos / f.quantidade
    const cpct  = totalFontes > 0 ? (f.quantidade / totalFontes) * 100 : 0
    if (cpct >= 20 && cconv < 0.05) {
      out.push({ id: `canal-crit-${f.origem}`, sev: "critical",
        title: `${f.origem} gera volume mas não gera vendas`,
        description: `${fmtInt.format(f.quantidade)} leads gerados, apenas ${fmtInt.format(f.ganhos)} convertidos (${pctFmt(cconv * 100)}).`,
      })
    } else if (f.quantidade >= 5 && cconv < 0.05) {
      out.push({ id: `canal-warn-${f.origem}`, sev: "warning",
        title: `${f.origem}: conversão abaixo de 5%`,
        description: `${fmtInt.format(f.ganhos)} ganhos em ${fmtInt.format(f.quantidade)} leads.`,
      })
    }
  }

  // ── Backend penalties ────────────────────────────────────────────────────────
  for (const p of backend ?? []) {
    if (!p?.titulo) continue
    const sev: AlertSev = p.tipo === "danger" ? "critical" : p.tipo === "warning" ? "warning" : "info"
    out.push({ id: `be-${p.titulo}`, sev, title: p.titulo, description: p.descricao })
  }

  const ORDER: Record<AlertSev, number> = { critical: 0, warning: 1, info: 2 }
  const seen = new Set<string>()
  return out
    .filter(a => { if (seen.has(a.title)) return false; seen.add(a.title); return true })
    .sort((a, b) => ORDER[a.sev] - ORDER[b.sev])
    .slice(0, 10)
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5 space-y-2">
            <Skeleton className="h-3 w-20" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-24" />
          </CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4 space-y-2">
            <Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-12" />
          </CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <Card className="lg:col-span-3"><CardContent className="p-5"><Skeleton className="h-[240px] w-full" /></CardContent></Card>
        <Card className="lg:col-span-2"><CardContent className="p-5"><Skeleton className="h-[240px] w-full" /></CardContent></Card>
      </div>
      <Card><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
    </div>
  )
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const TODAY = new Date()
const MESES_LABEL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function ym(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`
}
function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function BIDashboard() {
  const [mes, setMes] = useState(TODAY.getMonth())
  const [ano, setAno] = useState(TODAY.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Realtime — sempre sem filtro
  const { data: bi, isValidating, error, mutate } = useSWR<ComercialBI>(
    "/api/comercial/bi",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000, errorRetryCount: 2 },
  )

  // Histórico — fallback automático dia→mês está no BFF
  const historyUrl = buildHistoryUrl(
    selectedDate ? { dia: ymd(selectedDate) } : { mes: ym(ano, mes) }
  )
  const { data: history, isValidating: histValidating, error: histError, mutate: histMutate } = useSWR<ComercialHistory>(
    historyUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000, errorRetryCount: 2, keepPreviousData: true },
  )

  const hasError = !!error
  const isFirstLoad = !bi && !hasError && isValidating
  const anyValidating = isValidating || histValidating
  const refreshAll = () => { mutate(); histMutate() }

  const todosAlertas = useMemo(
    () => bi ? computeTodosAlertas(bi.kpis, bi.fontesLead, bi.score.penalties) : [],
    [bi],
  )

  const totalLeadsCaptados = bi
    ? (bi.kpis.leadsAtivos ?? 0) + (bi.kpis.leadsGanhos ?? 0) + (bi.kpis.leadsPerdidos ?? 0)
    : 0

  const canalMaiorVolume = useMemo(() => {
    if (!bi?.fontesLead?.length) return null
    return [...bi.fontesLead].sort((a, b) => b.quantidade - a.quantidade)[0] ?? null
  }, [bi?.fontesLead])

  const canalMelhorConversao = useMemo(() => {
    if (!bi?.fontesLead?.length) return null
    return [...bi.fontesLead]
      .filter(f => f.quantidade >= 3)
      .sort((a, b) => (b.ganhos / b.quantidade) - (a.ganhos / a.quantidade))[0] ?? null
  }, [bi?.fontesLead])

  const periodoLabel = selectedDate
    ? selectedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : `${MESES_LABEL[mes]} ${ano}`

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Comercial</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoramento operacional e performance de leads
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="ghost" className="h-9 w-9 p-0" aria-label="Atualizar" onClick={refreshAll}>
            <RefreshCw className={cn("h-4 w-4", anyValidating && "animate-spin")} />
          </Button>
          <a href="https://app.kommo.com" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="h-9 gap-2 text-xs font-semibold shadow-sm">
              <ExternalLink className="h-3.5 w-3.5" />Abrir Kommo
            </Button>
          </a>
        </div>
      </div>

      {/* Filter — mesmo padrão do dashboard e financeiro */}
      <GlobalDateFilter
        month={mes}
        year={ano}
        selectedDate={selectedDate}
        maxDate={new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())}
        onMonthChange={(m, y) => { setMes(m); setAno(y); setSelectedDate(null) }}
        onToday={() => { setMes(TODAY.getMonth()); setAno(TODAY.getFullYear()); setSelectedDate(TODAY) }}
        onDateSelect={(d) => setSelectedDate(d)}
      />

      {/* Error */}
      {hasError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <CardContent className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm text-red-800 dark:text-red-400">
              Não foi possível carregar os indicadores.
            </span>
            <Button size="sm" variant="outline" onClick={() => mutate()}>
              <RefreshCw className="h-3 w-3 mr-1" />Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {isFirstLoad && <LoadingSkeleton />}

      {/* Content */}
      {!isFirstLoad && !hasError && bi && (
        <>
          {/* ── Linha 1: 4 KPIs (captação + conversão) ───────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiTile
              label="Leads Captados"
              value={nfn(totalLeadsCaptados)}
              hint={bi.kpis.leadsAtivos != null ? `${nfn(bi.kpis.leadsAtivos)} ainda ativos` : undefined}
              icon={Users}
              tooltip={"O que é: Total de leads gerados no período (ativos + ganhos + perdidos). Mede o volume de oportunidades criadas.\n\nOrigem: Kommo CRM.\n\nAtualização: Automática a cada sincronização."}
            />
            <KpiTile
              label="Conversão Real"
              value={pctFmt(bi.kpis.taxaConversao)}
              hint="Ganhos ÷ total captados"
              icon={Percent}
              accent={
                bi.kpis.taxaConversao == null ? undefined
                : bi.kpis.taxaConversao >= 20 ? "emerald"
                : bi.kpis.taxaConversao < 10  ? "red"
                : "amber"
              }
              tooltip={"O que é: Leads ganhos ÷ total captados. Meta: acima de 20%. Abaixo de 10% indica problema no processo de vendas.\n\nOrigem: Calculado a partir do Kommo CRM.\n\nAtualização: Automática."}
            />
            <KpiTile
              label="Ganhos"
              value={nfn(bi.kpis.leadsGanhos)}
              hint="Fechados com sucesso"
              icon={CheckCircle2}
              accent="emerald"
              tooltip={"O que é: Leads convertidos em vendas no período. É o resultado direto do esforço comercial.\n\nOrigem: Kommo CRM.\n\nAtualização: Automática."}
            />
            <KpiTile
              label="Perdas"
              value={nfn(bi.kpis.leadsPerdidos)}
              hint="Leads encerrados"
              icon={XCircle}
              accent={bi.kpis.leadsPerdidos != null && bi.kpis.leadsPerdidos > 0 ? "red" : undefined}
              tooltip={"O que é: Leads encerrados sem conversão. Alta proporção vs ganhos indica problema de qualificação ou processo.\n\nOrigem: Kommo CRM.\n\nAtualização: Automática."}
            />
          </div>

          {/* ── Linha 2: 3 KPIs (resposta + canais destaque) ─────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiTile
              label="Tempo Médio Resposta"
              value={timeFmt(bi.kpis.tempoRespostaMedio)}
              hint="Meta: abaixo de 30min"
              icon={Clock}
              accent={
                bi.kpis.tempoRespostaMedio == null ? undefined
                : bi.kpis.tempoRespostaMedio >= 60 ? "red"
                : bi.kpis.tempoRespostaMedio >= 30 ? "amber"
                : "emerald"
              }
              tooltip={"O que é: Média de minutos entre a entrada do lead e o primeiro contato da equipe. Meta: abaixo de 30min. Acima de 60min é crítico.\n\nOrigem: Kommo CRM.\n\nAtualização: Automática."}
            />
            <KpiTile
              label="Maior Volume"
              value={canalMaiorVolume?.origem ?? ND}
              hint={canalMaiorVolume ? `${nfn(canalMaiorVolume.quantidade)} leads gerados` : "Sem dados"}
              icon={BarChart2}
              tooltip={"O que é: Canal que gerou o maior número de leads no período. Volume alto não significa conversão alta — use em conjunto com 'Melhor Conversão'.\n\nOrigem: Kommo CRM — fontes de lead.\n\nAtualização: Automática."}
            />
            <KpiTile
              label="Melhor Conversão"
              value={canalMelhorConversao?.origem ?? ND}
              hint={canalMelhorConversao ? `${pctFmt((canalMelhorConversao.ganhos / canalMelhorConversao.quantidade) * 100)} conversão` : "Sem dados"}
              icon={Award}
              accent="emerald"
              tooltip={"O que é: Canal com maior taxa de conversão (ganhos ÷ leads), considerando apenas canais com 3+ leads. Indica o canal com melhor ROI comercial.\n\nOrigem: Kommo CRM — fontes de lead.\n\nAtualização: Automática."}
            />
          </div>

          {/* ── Seção 2: IA Insights ───────────────────────────────────────── */}
          <InsightsComerciaisCard kpis={bi.kpis} fontes={bi.fontesLead} />

          {/* ── Centro de Atenção (alertas unificados) ────────────────────── */}
          <CentroDeAtencaoPanel alerts={todosAlertas} />

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-3">
              {histError ? (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
                  <CardContent className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm text-amber-800 dark:text-amber-400">Histórico indisponível.</span>
                    <Button size="sm" variant="outline" onClick={() => histMutate()}>
                      <RefreshCw className="h-3 w-3 mr-1" />Tentar novamente
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <EvolucaoCard history={history} periodoLabel={periodoLabel} />
              )}
            </div>
            <div className="lg:col-span-2">
              <OrigemCard fontes={bi.fontesLead} />
            </div>
          </div>

          {/* ── Seção 3: Funil + Seção 4: Ranking de Canais ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <FunilVisualCard stages={bi.pipeline.stages} ganhos={bi.kpis.leadsGanhos ?? null} />
            <RankingCanaisCard fontes={bi.fontesLead} />
          </div>

          {/* Pipeline Kanban */}
          <PipelineKanbanCard
            stages={bi.pipeline.stages}
            semResponsavel={bi.kpis.semResponsavel ?? 0}
            esquecidos={bi.kpis.esquecidos ?? 0}
          />

        </>
      )}

    </div>
  )
}
