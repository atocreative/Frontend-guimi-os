import { cn } from "@/lib/utils"
import { PERFORMANCE_LEVEL_COLORS } from "@/lib/colors-config"

interface NivelBadgeProps {
  nivel: string
  pontos: number
  progresso: number
  sequencia: number
}

const nivelCor: Record<string, string> = PERFORMANCE_LEVEL_COLORS

const nivelBarra: Record<string, string> = {
  "Iniciante": "bg-zinc-500",
  "Avançado": "bg-blue-500",
  "Expert": "bg-purple-500",
  "Lenda": "bg-amber-500",
}

export function NivelBadge({
  nivel,
  pontos,
  progresso,
  sequencia,
}: NivelBadgeProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-xs font-semibold px-2 py-0.5 rounded-full border",
          nivelCor[nivel] ?? nivelCor["Iniciante"]
        )}>
          {nivel}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            🔥 {sequencia} dias seguidos
          </span>
          <span className="text-xs font-bold">
            {pontos.toLocaleString("pt-BR")} pts
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            nivelBarra[nivel] ?? "bg-zinc-500"
          )}
          style={{ width: `${progresso}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {progresso}% para o próximo nível
      </p>
    </div>
  )
}
