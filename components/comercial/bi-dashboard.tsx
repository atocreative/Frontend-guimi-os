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
import { GlobalDateFilter } from "@/components/global/global-date-filter"
import { cn } from "@/lib/utils"
import {
  AlertTriangle, TrendingUp, Users, Zap,
  RefreshCw, CheckCircle2, Info, ShieldAlert,
  Clock, UserX, BarChart2,
  XCircle, MessageSquare, MessageCircle, Timer,
  ExternalLink, Percent, Activity,
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
}

function KpiTile({ label, value, hint, icon: Icon, size = "lg", accent }: KpiProps) {
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
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              {label}
            </p>
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

// ─── Alertas — computed from KPIs (operacional) ───────────────────────────────

type AlertSev = "critical" | "warning" | "info"
interface OpAlert { id: string; sev: AlertSev; title: string; description: string }

const SEV_META: Record<AlertSev, { icon: React.ElementType; row: string; iconCn: string; badge: string; label: string }> = {
  critical: { icon: ShieldAlert,    row: "border-red-500/40 bg-red-500/10",       iconCn: "text-red-500",    badge: "bg-red-500/20 text-red-400 border-red-500/30",       label: "Crítico" },
  warning:  { icon: AlertTriangle,  row: "border-yellow-500/40 bg-yellow-500/10", iconCn: "text-yellow-500", badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Atenção" },
  info:     { icon: Info,           row: "border-blue-500/30 bg-blue-500/8",      iconCn: "text-blue-400",   badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",     label: "Info" },
}

function computeAlerts(kpis: KPIs, backend: ScorePenalty[]): OpAlert[] {
  const out: OpAlert[] = []
  const chats = kpis.chatsSemResposta
  const tresp = kpis.tempoRespostaMedio
  const esq   = kpis.esquecidos
  const sown  = kpis.semResponsavel
  const stask = kpis.leadsSemTarefa
  const conv  = kpis.taxaConversao

  if (chats != null && chats >= 100) out.push({ id: "chats-critical", sev: "critical", title: "Muitos chats sem resposta", description: `${fmtInt.format(chats)} chats aguardando equipe.` })
  else if (chats != null && chats >= 30) out.push({ id: "chats-warn", sev: "warning", title: "Chats sem resposta acumulando", description: `${fmtInt.format(chats)} chats pendentes.` })

  if (tresp != null && tresp >= 60) out.push({ id: "tresp-critical", sev: "critical", title: "Tempo de resposta crítico", description: `${timeFmt(tresp)} de média — meta < 30min.` })
  else if (tresp != null && tresp >= 30) out.push({ id: "tresp-warn", sev: "warning", title: "Tempo de resposta alto", description: `${timeFmt(tresp)} de média — meta < 30min.` })

  if (esq != null && esq > 0) out.push({ id: "esquec", sev: "critical", title: "Leads esquecidos", description: `${fmtInt.format(esq)} leads sem interação recente.` })
  if (sown != null && sown > 0) out.push({ id: "sown", sev: "warning", title: "Leads sem responsável", description: `${fmtInt.format(sown)} leads aguardando owner.` })
  if (stask != null && stask >= 10) out.push({ id: "stask", sev: "warning", title: "Leads sem tarefa", description: `${fmtInt.format(stask)} leads sem follow-up agendado.` })
  if (conv != null && conv < 5)  out.push({ id: "conv-low", sev: "warning", title: "Conversão baixa", description: `Taxa atual em ${pctFmt(conv)}.` })

  // backend penalties (se vier conteúdo válido, mescla)
  for (const p of backend ?? []) {
    if (!p?.titulo) continue
    const sev: AlertSev = p.tipo === "danger" ? "critical" : p.tipo === "warning" ? "warning" : "info"
    out.push({ id: `be-${p.titulo}`, sev, title: p.titulo, description: p.descricao })
  }

  return out.sort((a, b) => {
    const o: Record<AlertSev, number> = { critical: 0, warning: 1, info: 2 }
    return o[a.sev] - o[b.sev]
  })
}

function AlertasMiniCard({ alerts }: { alerts: OpAlert[] }) {
  const count = alerts.filter(a => a.sev !== "info").length
  const top = alerts[0]
  const accent: "red" | "amber" | "emerald" = count > 3 ? "red" : count > 0 ? "amber" : "emerald"

  return (
    <KpiTile
      label="Alertas"
      value={fmtInt.format(count)}
      hint={count === 0 ? "Operacional saudável" : top?.title ?? "Atenção necessária"}
      icon={AlertTriangle}
      size="sm"
      accent={accent}
    />
  )
}

function AlertasPanel({ alerts }: { alerts: OpAlert[] }) {
  if (alerts.length === 0) return null
  const critical = alerts.filter(a => a.sev === "critical").length
  const warnings = alerts.filter(a => a.sev === "warning").length

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Alertas operacionais</CardTitle>
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[220px] overflow-y-auto px-4 pb-4 space-y-1.5">
          {alerts.slice(0, 8).map((a) => {
            const meta = SEV_META[a.sev]
            const Icon = meta.icon
            return (
              <div key={a.id} className={cn("flex items-start gap-2 rounded-lg border px-3 py-2", meta.row)}>
                <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", meta.iconCn)} />
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

  const alerts = useMemo(
    () => bi ? computeAlerts(bi.kpis, bi.score.penalties) : [],
    [bi],
  )

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
          {/* Linha 1 — KPIs principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile
              label="Leads Ativos"
              value={nfn(bi.kpis.leadsAtivos)}
              hint={bi.kpis.semResponsavel ? `${fmtInt.format(bi.kpis.semResponsavel)} sem responsável` : "Em acompanhamento"}
              icon={Users}
            />
            <KpiTile
              label="Leads Ganhos"
              value={nfn(bi.kpis.leadsGanhos)}
              hint={bi.kpis.taxaConversao != null ? `${pctFmt(bi.kpis.taxaConversao)} conversão` : "Fechamentos"}
              icon={CheckCircle2}
            />
            <KpiTile
              label="Leads Perdidos"
              value={nfn(bi.kpis.leadsPerdidos)}
              hint="No total"
              icon={XCircle}
            />
            <KpiTile
              label="Taxa Conversão"
              value={pctFmt(bi.kpis.taxaConversao)}
              hint="Ganhos vs total"
              icon={Percent}
            />
          </div>

          {/* Linha 2 — Operacional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile
              label="Chats sem resposta"
              value={nfn(bi.kpis.chatsSemResposta)}
              hint={
                bi.kpis.chatsSemResposta == null ? "Sem dado"
                : bi.kpis.chatsSemResposta > 0 ? "Aguardando equipe"
                : "Todos respondidos"
              }
              icon={MessageCircle}
              size="sm"
            />
            <KpiTile
              label="Conversas atuais"
              value={nfn(bi.kpis.conversasAtuais)}
              hint="Em andamento"
              icon={MessageSquare}
              size="sm"
            />
            <KpiTile
              label="Tempo resposta"
              value={timeFmt(bi.kpis.tempoRespostaMedio)}
              hint="Média geral"
              icon={Timer}
              size="sm"
            />
            <AlertasMiniCard alerts={alerts} />
          </div>

          {/* Linha 3 — Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-3">
              {histError ? (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
                  <CardContent className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm text-amber-800 dark:text-amber-400">
                      Histórico indisponível.
                    </span>
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

          {/* Linha 4 — Pipeline */}
          <PipelineKanbanCard
            stages={bi.pipeline.stages}
            semResponsavel={bi.kpis.semResponsavel ?? 0}
            esquecidos={bi.kpis.esquecidos ?? 0}
          />

          {/* Painel de Alertas (frontend-derived) */}
          <AlertasPanel alerts={alerts} />
        </>
      )}

    </div>
  )
}
