import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface KpiCardProps {
  titulo: string
  valor: string
  descricao?: string
  icone: LucideIcon
  tendencia?: "up" | "down" | "neutral"
  destaque?: boolean
  /** info=azul (receita), positive=verde (lucro), negative=vermelho (despesa) */
  accent?: "info" | "positive" | "negative" | "neutral"
}

export function KpiCard({
  titulo,
  valor,
  descricao,
  icone: Icone,
  tendencia,
  destaque,
  accent = "neutral",
}: KpiCardProps) {
  const valueClass = destaque
    ? "text-white dark:text-zinc-950"
    : accent === "positive" ? "text-emerald-600 dark:text-emerald-400"
    : accent === "negative" ? "text-rose-500"
    : accent === "info"     ? "text-blue-600 dark:text-blue-400"
    : ""

  return (
    <Card className={cn(
      "relative overflow-hidden",
      destaque && "border-zinc-400 bg-zinc-950 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-950"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className={cn(
              "text-xs font-medium uppercase tracking-wide",
              destaque ? "text-zinc-400 dark:text-zinc-500" : "text-muted-foreground"
            )}>
              {titulo}
            </p>
            <p className={cn(
              "text-2xl font-bold tracking-tight tabular-nums",
              valueClass
            )}>
              {valor}
            </p>
            {descricao && (
              <p className={cn(
                "text-xs",
                destaque ? "text-zinc-400 dark:text-zinc-500" : "text-muted-foreground"
              )}>
                {descricao}
              </p>
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
      </CardContent>
    </Card>
  )
}
