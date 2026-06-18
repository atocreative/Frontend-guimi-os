"use client"

import { useState } from "react"
import {
  AlertTriangle, CheckCircle2, AlertCircle, RefreshCw,
  Activity, Clock, Database, Radio,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useSystemAudit } from "@/lib/queries/use-system-audit"
import type { AuditKpiRow, AuditAlert } from "@/app/api/system/audit/full/route"

// ─── helpers ─────────────────────────────────────────────────────────────────

function brl(v: number | null) {
  if (v === null) return "—"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(v)
}

function pctLabel(v: number | null) {
  if (v === null) return "—"
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
}

function formatSync(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  })
}

// ─── Status dot ──────────────────────────────────────────────────────────────

type StatusLevel = "ok" | "degraded" | "down"

const STATUS_DOT: Record<StatusLevel, string>   = { ok: "🟢", degraded: "🟡", down: "🔴" }
const STATUS_LABEL: Record<StatusLevel, string>  = { ok: "Estável", degraded: "Degradado", down: "Indisponível" }
const STATUS_CLASS: Record<StatusLevel, string>  = {
  ok:       "text-emerald-600 dark:text-emerald-400",
  degraded: "text-amber-600 dark:text-amber-400",
  down:     "text-red-600 dark:text-red-400",
}

// ─── Drift row status styles ──────────────────────────────────────────────────

const DRIFT_STATUS: Record<"ok" | "warning" | "critical", { badge: string; row: string }> = {
  ok:       { badge: "border-emerald-300 text-emerald-700 dark:text-emerald-400", row: "" },
  warning:  { badge: "border-amber-300 text-amber-700 dark:text-amber-400",       row: "bg-amber-50/40 dark:bg-amber-950/20" },
  critical: { badge: "border-red-300 text-red-700 dark:text-red-400",             row: "bg-red-50/50 dark:bg-red-950/20" },
}

// ─── Alert icon ──────────────────────────────────────────────────────────────

const ALERT_ICON: Record<AuditAlert["severity"], typeof AlertCircle> = {
  critical: AlertCircle,
  warning:  AlertTriangle,
  info:     Activity,
}

const ALERT_STYLE: Record<AuditAlert["severity"], { bg: string; text: string; border: string; iconBg: string }> = {
  critical: { bg: "bg-rose-50/70 dark:bg-rose-950/30",   text: "text-rose-700 dark:text-rose-300",   border: "border border-rose-200/60 dark:border-rose-900/40",   iconBg: "bg-rose-100 dark:bg-rose-900/40" },
  warning:  { bg: "bg-amber-50/70 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", border: "border border-amber-200/60 dark:border-amber-900/40", iconBg: "bg-amber-100 dark:bg-amber-900/40" },
  info:     { bg: "bg-blue-50/60 dark:bg-blue-950/30",   text: "text-blue-700 dark:text-blue-300",   border: "border border-blue-200/50 dark:border-blue-900/40",   iconBg: "bg-blue-100 dark:bg-blue-900/30" },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SyncRow({
  name, status, lastSync, isStable,
}: {
  name: string
  status: StatusLevel
  lastSync: string | null
  isStable: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="flex items-center gap-2 text-sm font-medium">
        <span>{STATUS_DOT[status]}</span>
        {name}
        {!isStable && (
          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">
            instável
          </Badge>
        )}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
        <Clock className="h-3 w-3" />
        {formatSync(lastSync)}
        <span className={`font-medium ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
      </span>
    </div>
  )
}

function KpiTable({ rows }: { rows: AuditKpiRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2">KPI</th>
            <th className="px-3 py-2 text-right">FN</th>
            <th className="px-3 py-2 text-right">MA</th>
            <th className="px-3 py-2 text-right">CONSOLIDADO</th>
            <th className="px-3 py-2 text-right">Drift</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const s = DRIFT_STATUS[row.status]
            return (
              <tr key={row.key} className={`border-b transition-colors ${s.row}`}>
                <td className="px-3 py-2.5 font-medium text-foreground">{row.label}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{brl(row.fn)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{brl(row.ma)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-medium">{brl(row.consolidated)}</td>
                <td className="px-3 py-2.5 text-right">
                  {row.drift !== null ? (
                    <Badge variant="outline" className={`text-[10px] font-mono ${s.badge}`}>
                      {pctLabel(row.drift)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function DriftChart({ rows }: { rows: AuditKpiRow[] }) {
  const chartData = rows
    .filter((r) => r.drift !== null)
    .map((r) => ({ name: r.label, drift: r.drift! }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
        Sem dados de drift disponíveis.
      </div>
    )
  }

  function barColor(drift: number) {
    const abs = Math.abs(drift)
    if (abs >= 10) return "#ef4444"
    if (abs >= 2)  return "#f59e0b"
    return "#22c55e"
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 9 }}
          stroke="hsl(var(--muted-foreground))"
          angle={-30}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          stroke="hsl(var(--muted-foreground))"
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(2)}%`, "Drift"]}
          contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
          cursor={{ fill: "transparent" }}
        />
        <ReferenceLine y={0}   stroke="hsl(var(--foreground))" strokeOpacity={0.3} />
        <ReferenceLine y={2}   stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.6} />
        <ReferenceLine y={-2}  stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.6} />
        <ReferenceLine y={10}  stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.5} />
        <ReferenceLine y={-10} stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.5} />
        <Bar dataKey="drift" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={barColor(entry.drift)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function SystemAuditDashboard() {
  const now = new Date()
  const [month] = useState(now.getMonth() + 1)
  const [year]  = useState(now.getFullYear())

  const { data, isLoading, isError, isFetching, dataUpdatedAt } = useSystemAudit(month, year)

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
        <CardContent className="px-4 py-3 text-sm text-red-800 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Falha ao carregar dados de auditoria. Verifique permissões e conexão com o backend.
        </CardContent>
      </Card>
    )
  }

  const overallOk  = data.health.overall === "ok"
  const critAlerts = data.alerts.filter((a) => a.severity === "critical")
  const warnAlerts = data.alerts.filter((a) => a.severity === "warning")

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Auditoria do Sistema</h2>
          <p className="text-sm text-muted-foreground">
            Inspeção de consistência entre fontes de dados financeiras.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isFetching && (
            <Badge variant="outline" className="gap-1 text-muted-foreground/70">
              <RefreshCw className="h-3 w-3 animate-spin" /> atualizando
            </Badge>
          )}
          {lastUpdated && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Sync: {lastUpdated}
            </span>
          )}
          <Badge
            variant="outline"
            className={overallOk
              ? "gap-1 border-emerald-300 text-emerald-700 dark:text-emerald-400"
              : "gap-1 border-amber-300 text-amber-700 dark:text-amber-400"
            }
          >
            {overallOk
              ? <><CheckCircle2 className="h-3 w-3" /> Todos os sistemas OK</>
              : <><AlertTriangle className="h-3 w-3" /> {critAlerts.length + warnAlerts.length} problema{critAlerts.length + warnAlerts.length !== 1 ? "s" : ""} detectado{critAlerts.length + warnAlerts.length !== 1 ? "s" : ""}</>
            }
          </Badge>
        </div>
      </div>

      {/* ── Sync Status Panel ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Radio className="h-4 w-4 text-muted-foreground" />
            Status de Sincronização
            <Badge variant="outline" className="ml-auto text-[10px] font-mono font-normal text-muted-foreground">
              {data.sourceType ? `sourceType: ${data.sourceType}` : "sourceType: —"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <SyncRow name="FN (FoneNinja)"    {...data.health.fn} />
          <SyncRow name="MA (MeuAssessor)"  {...data.health.ma} />
          <SyncRow name="Snapshot"          {...data.health.snapshot} />
        </CardContent>
      </Card>

      {/* ── KPI Comparison Table ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            Comparativo de KPIs: FN × MA × Consolidado
            <span className="ml-auto text-[11px] font-normal text-muted-foreground">
              {new Date(0, data.period.month - 1).toLocaleString("pt-BR", { month: "long" })} {data.period.year}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-1">
          <KpiTable rows={data.kpis} />
        </CardContent>
      </Card>

      {/* ── Drift Chart ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Drift por KPI (%)
          </CardTitle>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Divergência percentual entre fonte primária (FN/MA) e valor consolidado.
            Linhas de referência: <span className="text-amber-500">±2% aviso</span> · <span className="text-red-500">±10% crítico</span>.
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          <DriftChart rows={data.kpis} />
        </CardContent>
      </Card>

      {/* ── Alerts ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alertas
            {critAlerts.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">{critAlerts.length} crítico{critAlerts.length !== 1 ? "s" : ""}</Badge>
            )}
            {warnAlerts.length > 0 && (
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400">{warnAlerts.length} aviso{warnAlerts.length !== 1 ? "s" : ""}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.alerts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Nenhum problema detectado. Todas as fontes estão consistentes.
            </div>
          ) : (
            data.alerts.map((alert, i) => {
              const Icon  = ALERT_ICON[alert.severity]
              const style = ALERT_STYLE[alert.severity]
              return (
                <div key={i} className={`flex items-start gap-2.5 rounded-md px-3 py-2 ${style.bg} ${style.text} ${style.border}`}>
                  <div className={`rounded-md p-1 shrink-0 ${style.iconBg}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight">{alert.label}</p>
                    <p className="text-[11px] leading-snug opacity-80 mt-0.5">{alert.detail}</p>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

    </div>
  )
}
