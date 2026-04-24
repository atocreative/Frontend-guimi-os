import { cn } from "@/lib/utils"
import type {
  mockConquistas,
} from "@/app/(dashboard)/data/mock"

type Conquista = (typeof mockConquistas)[number]

const raridadeCor: Record<string, string> = {
  comum: "border-zinc-200 bg-zinc-50",
  raro: "border-blue-500/30 bg-blue-500/5",
  epico: "border-amber-500/30 bg-amber-500/5",
}

const raridadeLabel: Record<string, string> = {
  comum: "Comum",
  raro: "Raro",
  epico: "Épico",
}

interface ConquistasProps {
  conquistas: Conquista[]
  desbloqueadas: string[]
}

export function Conquistas({ conquistas, desbloqueadas }: ConquistasProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {conquistas.map((conquista) => {
        const desbloqueada = desbloqueadas.includes(conquista.id)
        return (
          <div
            key={conquista.id}
            className={cn(
              "rounded-lg border p-2.5 text-center space-y-1 transition-all",
              desbloqueada
                ? raridadeCor[conquista.raridade]
                : "border-dashed border-zinc-200 opacity-30 grayscale"
            )}
          >
            <p className="text-2xl">{conquista.emoji}</p>
            <p className="text-xs font-semibold leading-tight">
              {conquista.titulo}
            </p>
            <p className="text-xs text-muted-foreground leading-tight hidden sm:block">
              {conquista.descricao}
            </p>
            {desbloqueada && (
              <span className="text-xs text-muted-foreground">
                {raridadeLabel[conquista.raridade]}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
