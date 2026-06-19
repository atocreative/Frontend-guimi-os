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
      <td colSpan={span} className="px-6 py-6 text-center text-sm text-muted-foreground">
        {text}
      </td>
    </tr>
  )
}

// ── Card 1: Estoque Crítico ───────────────────────────────────────────────────

function EstoqueCriticoCard({ items }: { items: AlertItem[] }) {
  const rows = items.slice(0, MAX_ROWS)
  return (
    <Card className="border-rose-200/40 dark:border-rose-900/30 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-md bg-rose-500/10 p-1.5">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </span>
          Estoque Crítico
        </CardTitle>
        <CardDescription>Produtos com saldo abaixo do mínimo</CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto flex-1">
        <table className="w-full text-sm min-w-[450px]">
          <thead className="border-b">
            <tr>
              <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Produto</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Estoque</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Vendas 30d</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Motivo</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Ação sugerida</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <EmptyRow text="Nenhum produto crítico nos critérios atuais." span={5} />
            ) : (
              rows.map((it, i) => (
                <tr key={it.id ?? i} className={ROW}>
                  <td className="px-6 font-medium truncate max-w-[160px] text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{it.produto}</span>
                      {it.confianca === "low" && (
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-normal whitespace-nowrap text-muted-foreground border-muted-foreground/30">Baixa confiança</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 text-right">
                    {it.stockQuantity != null ? (
                      <Badge
                        variant="destructive"
                        className={cn("tabular-nums font-semibold text-xs", it.stockQuantity === 0 && "animate-pulse")}
                      >
                        {intl.format(it.stockQuantity)} un.
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground" title="Faltam dados de estoque">dados incompletos</Badge>
                    )}
                  </td>
                  <td className="px-4 text-right tabular-nums text-xs">
                    {it.vendas30d != null ? intl.format(it.vendas30d) : "—"}
                  </td>
                  <td className="px-4 text-xs text-muted-foreground max-w-[120px] truncate" title={it.motivo || ""}>
                    {it.motivo || "—"}
                  </td>
                  <td className="px-6 text-xs font-medium text-rose-600 max-w-[140px] truncate" title={it.sugestao || ""}>
                    {it.sugestao || "—"}
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
    <Card className="border-amber-200/40 dark:border-amber-900/30 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-md bg-amber-500/10 p-1.5">
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </span>
          Reposição Recomendada
        </CardTitle>
        <CardDescription>Alta demanda · risco de ruptura</CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto flex-1">
        <table className="w-full text-sm min-w-[450px]">
          <thead className="border-b">
            <tr>
              <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Produto</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Estoque</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Vendas 30d</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Dias de estoque</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Ação sugerida</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <EmptyRow text="Nenhuma reposição urgente recomendada." span={5} />
            ) : (
              rows.map((it, i) => (
                <tr key={it.id ?? i} className={ROW}>
                  <td className="px-6 font-medium truncate max-w-[160px] text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{it.produto}</span>
                      {it.confianca === "low" && (
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-normal whitespace-nowrap text-muted-foreground border-muted-foreground/30">Baixa confiança</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 text-right tabular-nums text-muted-foreground text-xs">
                    {it.stockQuantity != null ? intl.format(it.stockQuantity) : <Badge variant="outline" className="text-[10px] text-muted-foreground" title="Faltam dados de estoque">dados incompletos</Badge>}
                  </td>
                  <td className="px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold tabular-nums text-xs">
                      <TrendingUp className="h-3 w-3" />
                      {it.vendas30d != null ? intl.format(it.vendas30d) : "—"}
                    </span>
                  </td>
                  <td className="px-4 text-right tabular-nums text-muted-foreground text-xs">
                    {it.diasDeEstoque != null ? `${intl.format(it.diasDeEstoque)} d` : "—"}
                  </td>
                  <td className="px-6 text-xs font-medium text-amber-600 max-w-[140px] truncate" title={it.sugestao || ""}>
                    {it.sugestao || "—"}
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
    <Card className="border-slate-200/40 dark:border-slate-800/40 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-md bg-slate-500/10 p-1.5">
            <Clock className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </span>
          Estoque Parado
        </CardTitle>
        <CardDescription>Capital parado · oportunidade de promoção</CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto flex-1">
        <table className="w-full text-sm min-w-[450px]">
          <thead className="border-b">
            <tr>
              <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Produto</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Estoque</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Vendas 30d</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Val. parado</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground">Ação sugerida</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <EmptyRow text="Nenhum item parado relevante encontrado." span={5} />
            ) : (
              rows.map((it, i) => (
                <tr key={it.id ?? i} className={ROW}>
                  <td className="px-6 font-medium truncate max-w-[160px] text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 truncate">
                        {(it.diasParado ?? 0) > 60 && (
                          <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                        <span className="truncate">{it.produto}</span>
                      </span>
                      {it.confianca === "low" && (
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-normal whitespace-nowrap text-muted-foreground border-muted-foreground/30">Baixa confiança</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 text-right tabular-nums text-muted-foreground text-xs">
                    {it.stockQuantity != null ? intl.format(it.stockQuantity) : <Badge variant="outline" className="text-[10px] text-muted-foreground" title="Faltam dados de estoque">dados incompletos</Badge>}
                  </td>
                  <td className="px-4 text-right tabular-nums text-muted-foreground text-xs">
                    {it.vendas30d != null ? intl.format(it.vendas30d) : "—"}
                  </td>
                  <td className="px-4 text-right tabular-nums text-xs font-medium">
                    {it.valorParado != null && it.valorParado > 0
                      ? brl.format(it.valorParado)
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-6 text-xs font-medium text-slate-600 dark:text-slate-300 max-w-[140px] truncate" title={it.sugestao || ""}>
                    {it.sugestao || "—"}
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

  if (process.env.NODE_ENV === "development" || true) {
    if (alerts.criticalStock.length > 0 && alerts.criticalStock[0].stockQuantity != null) {
      console.log(`[OP_ALERTS_UI_SAMPLE] criticalStockQty=${alerts.criticalStock[0].stockQuantity}`)
    }
    
    const checkAlerts = (list: AlertItem[]) => {
      list.forEach(alert => {
        if (alert.stockQuantity == null) {
          console.warn(`[OP_ALERTS_UI_WARNING] missing stockQuantity for ${alert.produto}`)
        }
      })
    }
    
    if (!loading) {
      checkAlerts(alerts.criticalStock)
      checkAlerts(alerts.recommendedRestock)
      checkAlerts(alerts.slowMovingStock)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Alertas Operacionais</h2>
        <p className="text-sm text-muted-foreground">Inteligência de estoque em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
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
