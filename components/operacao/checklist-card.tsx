"use client"

import { useOptimistic, useTransition } from "react"
import { CheckCircle2, Circle, Clock, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface ItemChecklist {
  id: string
  titulo: string
  descricao?: string | null
  concluido: boolean
  responsavel: string
  horario?: string | null
}

interface ChecklistCardProps {
  titulo: string
  itens: ItemChecklist[]
  tipo: "abertura" | "fechamento"
  onToggle?: (id: string) => Promise<void>
}

export function ChecklistCard({ titulo, itens, tipo, onToggle }: ChecklistCardProps) {
  const [isPending, startTransition] = useTransition()

  const [optimisticItens, toggleOptimisticItem] = useOptimistic(
    itens,
    (state, idToToggle: string) =>
      state.map((item) =>
        item.id === idToToggle ? { ...item, concluido: !item.concluido } : item
      )
  )

  function handleToggle(id: string) {
    if (!onToggle) return
    startTransition(async () => {
      toggleOptimisticItem(id)
      try {
        await onToggle(id)
      } catch (error) {
        // Optimistic UI will automatically revert with parent state if error happens
        console.error("Failed to toggle item", error)
      }
    })
  }

  const concluidos = optimisticItens.filter((i) => i.concluido).length
  const total = optimisticItens.length
  const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{titulo}</CardTitle>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              percentual === 100
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : tipo === "abertura"
                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
            )}
          >
            {concluidos}/{total} — {percentual}%
          </Badge>
        </div>

        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              percentual === 100 ? "bg-emerald-500" : "bg-amber-500"
            )}
            style={{ width: `${percentual}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {optimisticItens.map((item) => (
          <div
            key={item.id}
            onClick={() => handleToggle(item.id)}
            className={cn(
              "flex items-start gap-3 rounded-lg px-3 py-2 border cursor-pointer hover:bg-muted/50 transition-colors",
              item.concluido && "opacity-60 bg-muted/30"
            )}
          >
            {item.concluido ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-xs font-medium",
                item.concluido && "line-through text-muted-foreground"
              )}>
                {item.titulo}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {item.responsavel}
                </span>
                {item.horario && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {item.horario}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
