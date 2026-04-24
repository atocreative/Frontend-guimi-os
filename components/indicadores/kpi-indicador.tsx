import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiIndicadorProps {
  titulo: string
  valor: string
  descricao?: string
  icone: LucideIcon
  variacao?: number
  variacaoLabel?: string
}

export function KpiIndicador({
  titulo,
  valor,
  descricao,
  icone: Icone,
  variacao,
  variacaoLabel,
}: KpiIndicadorProps) {
  const positivo = variacao !== undefined && variacao >= 0

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {titulo}
            </p>
            <p className="text-2xl font-bold tracking-tight">{valor}</p>
            {descricao && (
              <p className="text-xs text-muted-foreground">{descricao}</p>
            )}
          </div>
          <div className="rounded-lg bg-muted p-2">
            <Icone className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        {variacao !== undefined && (
          <div className="mt-3 flex items-center gap-1">
            <span className={cn(
              "text-xs font-medium",
              positivo ? "text-emerald-500" : "text-rose-500"
            )}>
              {positivo ? "▲" : "▼"} {Math.abs(variacao)}
              {variacaoLabel ?? ""}
            </span>
            <span className="text-xs text-muted-foreground">vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
