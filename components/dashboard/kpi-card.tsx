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
}

export function KpiCard({
  titulo,
  valor,
  descricao,
  icone: Icone,
  tendencia,
  destaque,
}: KpiCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden",
      destaque && "border-zinc-400 bg-zinc-950 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-950"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className={cn(
              "text-xs font-medium uppercase tracking-wide",
              destaque ? "text-zinc-400 dark:text-zinc-500" : "text-muted-foreground"
            )}>
              {titulo}
            </p>
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              destaque && "text-white dark:text-zinc-950"
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
            destaque ? "bg-zinc-800 dark:bg-zinc-100" : "bg-muted"
          )}>
            <Icone className={cn(
              "h-4 w-4",
              destaque ? "text-zinc-300 dark:text-zinc-600" : "text-muted-foreground"
            )} />
          </div>
        </div>
        {tendencia && (
          <div className="mt-3 flex items-center gap-1">
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
