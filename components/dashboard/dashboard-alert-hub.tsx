"use client"

import Link from "next/link"
import { AlertTriangle, Info, CheckCircle2, AlertCircle, Clock, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useDashboardAlertHub } from "@/lib/queries/use-dashboard-alert-hub"
import type { AttentionItem, SummaryChip } from "@/lib/types/dashboard"

const AREA_LABELS: Record<string, string> = {
  financeiro: "Financeiro",
  operacao: "Operação",
  comercial: "Comercial",
  colaboradores: "Equipe",
  agenda: "Agenda",
  tarefas: "Tarefas",
  ranking: "Ranking",
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Atenção",
  low: "Info",
}

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-rose-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-slate-400",
}

const CHIP_STYLES: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  danger: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400",
  info: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
}

const LEFT_BORDER: Record<string, string> = {
  danger: "border-l-2 border-l-rose-500",
  warning: "border-l-2 border-l-amber-500",
  success: "border-l-2 border-l-emerald-500",
  info: "border-l-2 border-l-blue-500",
}

function TypeIcon({ type }: { type: AttentionItem["type"] }) {
  switch (type) {
    case "danger":  return <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
    case "warning": return <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
    case "success": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
    case "info":    return <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
  }
}

function AttentionRow({ item }: { item: AttentionItem }) {
  const isGenericRec =
    !item.recommendation ||
    item.recommendation.toLowerCase().includes("analise o pipeline") ||
    item.recommendation.length < 5

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors",
      LEFT_BORDER[item.type] || LEFT_BORDER.info
    )}>
      <div className="mt-0.5 flex items-center gap-1.5 shrink-0">
        <span className={cn("h-2 w-2 rounded-full shrink-0 mt-0.5", SEVERITY_DOT[item.severity])} />
        <TypeIcon type={item.type} />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {AREA_LABELS[item.area] || item.area}
          </span>
          <span className="text-[10px] text-muted-foreground/60">·</span>
          <span className="text-[10px] text-muted-foreground/70">{SEVERITY_LABEL[item.severity]}</span>
        </div>
        <p className="text-xs font-medium text-foreground leading-snug">{item.title}</p>
        {item.impact && (
          <p className="text-[11px] text-muted-foreground leading-snug">{item.impact}</p>
        )}
        {!isGenericRec && (
          <p className="text-[11px] text-muted-foreground/80 leading-snug">
            <span className="font-medium text-foreground/70">Ação:</span> {item.recommendation}
          </p>
        )}
      </div>
      <Link
        href={item.actionHref}
        className="shrink-0 flex items-center gap-0.5 text-[11px] text-primary hover:underline mt-0.5 font-medium whitespace-nowrap"
      >
        {item.actionLabel || "Ver"}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}

function SummaryChips({ chips }: { chips: SummaryChip[] }) {
  if (!chips.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
            CHIP_STYLES[chip.type] || CHIP_STYLES.info
          )}
        >
          {chip.label} <span className="font-semibold">{chip.value}</span>
        </span>
      ))}
    </div>
  )
}

interface Props {
  month: number
  year: number
  date?: string
}

export function DashboardAlertHub({ month, year, date }: Props) {
  const { data, isLoading, isError } = useDashboardAlertHub(month, year, date)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError || !data) return null

  const items = (data.attentionItems ?? []).slice(0, 6)
  const chips = data.summaryChips ?? []
  const criticalCount = items.filter(a => a.severity === "critical").length
  const highCount = items.filter(a => a.severity === "high" || a.severity === "medium").length

  return (
    <TooltipProvider>
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">Centro de Atenção</h2>
              {criticalCount > 0 && (
                <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20">
                  {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
                </Badge>
              )}
              {highCount > 0 && (
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                  {highCount} atenção
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">O que precisa de ação agora</p>
          </div>
          {data.stale && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="w-fit gap-1 text-xs font-normal">
                  <Clock className="h-3 w-3" />
                  Dados em cache
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exibindo último dado válido.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <SummaryChips chips={chips} />

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Nenhum ponto crítico agora. Continue acompanhando os indicadores.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map(item => (
              <AttentionRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
