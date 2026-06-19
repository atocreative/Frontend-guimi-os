import { cn } from "@/lib/utils"
import { Info, LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface KpiCardProps {
  titulo: string
  valor: string
  descricao?: string
  icone: LucideIcon
  tendencia?: "up" | "down" | "neutral"
  destaque?: boolean
  /** info=azul (receita), positive=verde (lucro), negative=vermelho (despesa) */
  accent?: "info" | "positive" | "negative" | "neutral"
  /** Tooltip nativo — explica origem e fórmula do KPI */
  tooltip?: string
  /** Indicador discreto de origem: LIVE · SNAPSHOT · CONSOL. */
  fonte?: string
  /** Substitui o valor por "Em breve" quando feature/endpoint não está pronto */
  emBreve?: boolean
  /** Barra de progresso — ex: meta mensal */
  progress?: { value: number; total: number; label?: string }
}

export function KpiCard({
  titulo,
  valor,
  descricao,
  icone: Icone,
  tendencia,
  destaque,
  accent = "neutral",
  tooltip,
  fonte,
  emBreve,
  progress,
}: KpiCardProps) {
  const valueClass = destaque
    ? "text-white dark:text-zinc-950"
    : accent === "positive" ? "text-emerald-600 dark:text-emerald-400"
    : accent === "negative" ? "text-rose-500"
    : accent === "info"     ? "text-blue-600 dark:text-blue-400"
    : ""

  const pct = progress && progress.total > 0
    ? Math.min(100, Math.round((progress.value / progress.total) * 100))
    : 0

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        destaque && "border-zinc-400 bg-zinc-950 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-950"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <p className={cn(
                "text-xs font-medium uppercase tracking-wide",
                destaque ? "text-zinc-400 dark:text-zinc-500" : "text-muted-foreground"
              )}>
                {titulo}
              </p>
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Sobre ${titulo}`}
                        className="rounded-full p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors focus:outline-none"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] whitespace-pre-line text-xs leading-snug">
                      {tooltip}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className={cn(
              "text-2xl font-bold tracking-tight tabular-nums",
              emBreve ? "text-muted-foreground/40 text-base italic" : valueClass
            )}>
              {emBreve ? "Em breve" : valor}
            </p>
            {descricao && (
              <p className={cn(
                "text-xs",
                destaque ? "text-zinc-400 dark:text-zinc-500" : "text-muted-foreground"
              )}>
                {descricao}
              </p>
            )}
            {fonte && (
              <span className="text-[10px] font-mono tracking-wide text-muted-foreground/40 select-none">
                {fonte}
              </span>
            )}
          </div>
          <div className={cn(
            "rounded-lg p-2",
            destaque ? "bg-zinc-800 dark:bg-zinc-100" : "bg-muted/60"
          )}>
            <Icone className={cn(
              "h-4 w-4",
              destaque ? "text-zinc-300 dark:text-zinc-600"
              : accent === "positive" ? "text-emerald-500"
              : accent === "negative" ? "text-rose-400"
              : accent === "info"     ? "text-blue-500"
              : "text-muted-foreground"
            )} />
          </div>
        </div>
        {tendencia && (
          <div className="mt-2 flex items-center gap-1">
            <span className={cn(
              "text-xs font-medium",
              tendencia === "up" && "text-emerald-500",
              tendencia === "down" && "text-rose-500",
              tendencia === "neutral" && "text-zinc-500",
            )}>
              {tendencia === "up" && "▲"}
              {tendencia === "down" && "▼"}
              {tendencia === "neutral" && "→"}
            </span>
          </div>
        )}
        {progress && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{progress.label ?? `${progress.value} / ${progress.total}`}</span>
              <span className={cn("font-semibold tabular-nums", pct >= 100 ? "text-emerald-500" : pct >= 70 ? "text-amber-500" : "text-rose-500")}>
                {pct}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-rose-500")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
