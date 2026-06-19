"use client"

import { AlertTriangle, TrendingUp, Clock, Sparkles, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useOperationDashboard } from "@/lib/queries/use-operation-dashboard"
import type { AlertItem, OperationalInsight, OperationalAlerts } from "@/app/api/operation/dashboard/route"

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_ROWS = 6

// ── Helpers ───────────────────────────────────────────────────────────────────

const intl = new Intl.NumberFormat("pt-BR")
const brl  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

const ROW = "h-11"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkel({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <Skeleton className="h-3 w-32" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn(ROW, "flex items-center gap-4 px-6")}>
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────

function EmptyRow({ text, span = 2 }: { text: string; span?: number }) {
  return (
    <tr className={ROW}>
      <td colSpan={span} className="px-6 text-center text-xs text-muted-foreground">
        {text}
      </td>
    </tr>
  )
}

// ── Card 1: Estoque Crítico ───────────────────────────────────────────────────

function EstoqueCriticoCard({ items }: { items: AlertItem[] }) {
  const rows = items.slice(0, MAX_ROWS)
  return (
    <Card className="border-rose-200/40 dark:border-rose-900/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-md bg-rose-500/10 p-1.5">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </span>
          Estoque Crítico
        </CardTitle>
        <CardDescription>Produtos com saldo abaixo do mínimo</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Produto</th>
              <th className="px-6 py-2 text-right text-xs font-medium text-muted-foreground">Estoque</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <EmptyRow text="Nenhum produto crítico nos critérios atuais." />
            ) : (
              rows.map((it, i) => (
                <tr key={it.id ?? i} className={ROW}>
                  <td className="px-6 font-medium truncate max-w-[200px] text-xs">{it.produto}</td>
                  <td className="px-6 text-right">
                    <Badge
                      variant="destructive"
                      className={cn("tabular-nums font-semibold text-xs", it.estoque === 0 && "animate-pulse")}
                    >
                      {intl.format(it.estoque ?? 0)} un.
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// ── Card 2: Reposição Recomendada ─────────────────────────────────────────────

function ReposicaoCard({ items }: { items: AlertItem[] }) {
  const rows = items.slice(0, MAX_ROWS)
  return (
    <Card className="border-amber-200/40 dark:border-amber-900/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-md bg-amber-500/10 p-1.5">
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </span>
          Reposição Recomendada
        </CardTitle>
        <CardDescription>Alta demanda · risco de ruptura</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Produto</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Estoque</th>
              <th className="px-6 py-2 text-right text-xs font-medium text-muted-foreground">Vendas 30d</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <EmptyRow text="Nenhuma reposição urgente recomendada." span={3} />
            ) : (
              rows.map((it, i) => (
                <tr key={it.id ?? i} className={ROW}>
                  <td className="px-6 font-medium truncate max-w-[160px] text-xs">{it.produto}</td>
                  <td className="px-4 text-right tabular-nums text-muted-foreground text-xs">
                    {intl.format(it.estoque ?? 0)}
                  </td>
                  <td className="px-6 text-right">
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold tabular-nums text-xs">
                      <TrendingUp className="h-3 w-3" />
                      {intl.format(it.vendas30d ?? 0)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// ── Card 3: Estoque Parado ────────────────────────────────────────────────────

function EstoqueParadoCard({ items }: { items: AlertItem[] }) {
  const rows = [...items]
    .sort((a, b) => (b.diasParado ?? 0) - (a.diasParado ?? 0))
    .slice(0, MAX_ROWS)

  return (
    <Card className="border-slate-200/40 dark:border-slate-800/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-md bg-slate-500/10 p-1.5">
            <Clock className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </span>
          Estoque Parado
        </CardTitle>
        <CardDescription>Capital parado · oportunidade de promoção</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Produto</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Dias</th>
              <th className="px-6 py-2 text-right text-xs font-medium text-muted-foreground">Val. parado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <EmptyRow text="Nenhum item parado relevante encontrado." span={3} />
            ) : (
              rows.map((it, i) => (
                <tr key={it.id ?? i} className={ROW}>
                  <td className="px-6 font-medium truncate max-w-[160px] text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      {(it.diasParado ?? 0) > 60 && (
                        <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                      )}
                      {it.produto}
                    </span>
                  </td>
                  <td className="px-4 text-right tabular-nums text-xs text-muted-foreground">
                    {intl.format(it.diasParado ?? 0)}
                  </td>
                  <td className="px-6 text-right tabular-nums text-xs font-medium">
                    {it.valorParado != null && it.valorParado > 0
                      ? brl.format(it.valorParado)
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// ── Insights ──────────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  success: "border-emerald-200/40 bg-emerald-50/30 dark:bg-emerald-950/10",
  warning: "border-amber-200/40 bg-amber-50/30 dark:bg-amber-950/10",
  danger:  "border-rose-200/40 bg-rose-50/30 dark:bg-rose-950/10",
  info:    "border-blue-200/40 bg-blue-50/30 dark:bg-blue-950/10",
}

const INSIGHT_ICON_STYLES: Record<string, string> = {
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger:  "text-rose-600",
  info:    "text-blue-600",
}

function InsightsSection({ insights }: { insights: OperationalInsight[] }) {
  if (insights.length === 0) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Insights operacionais
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((ins, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg border p-4 space-y-1",
              INSIGHT_STYLES[ins.type] ?? INSIGHT_STYLES.info
            )}
          >
            <div className="flex items-start gap-2">
              <Lightbulb className={cn("h-4 w-4 shrink-0 mt-0.5", INSIGHT_ICON_STYLES[ins.type] ?? INSIGHT_ICON_STYLES.info)} />
              <p className="text-sm font-semibold leading-tight">{ins.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">{ins.message}</p>
            {ins.recommendation && (
              <p className="text-xs font-medium text-foreground/80 mt-1">{ins.recommendation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AlertasOperacionais() {
  const now = new Date()
  const { data, isLoading } = useOperationDashboard(now.getMonth() + 1, now.getFullYear())

  const loading = isLoading && !data
  const alerts: OperationalAlerts = data?.operationalAlerts ?? {
    criticalStock: [],
    recommendedRestock: [],
    slowMovingStock: [],
    insights: [],
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Alertas Operacionais</h2>
        <p className="text-sm text-muted-foreground">Inteligência de estoque em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {loading ? (
          <>
            <CardSkel title="Estoque Crítico" />
            <CardSkel title="Reposição Recomendada" />
            <CardSkel title="Estoque Parado" />
          </>
        ) : (
          <>
            <EstoqueCriticoCard items={alerts.criticalStock} />
            <ReposicaoCard items={alerts.recommendedRestock} />
            <EstoqueParadoCard items={alerts.slowMovingStock} />
          </>
        )}
      </div>

      {!loading && alerts.insights.length > 0 && (
        <InsightsSection insights={alerts.insights} />
      )}
    </section>
  )
}
