import { memo, useMemo } from "react"
import { AlertTriangle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { isTaskAtrasada, sortTarefasByPriority } from "@/lib/tarefas"
import { TarefaCard } from "./tarefa-card"
import type { TarefaDB } from "@/types/tarefas"

interface ColunaPessoaProps {
  nome: string
  avatarUrl?: string | null
  tarefas: TarefaDB[]
  onComplete: (id: string, lateReason?: string) => void
  onDelete: (id: string) => void
  onEdit: (tarefa: TarefaDB) => void
}

export const ColunaPessoa = memo(function ColunaPessoa({
  nome,
  avatarUrl,
  tarefas,
  onComplete,
  onDelete,
  onEdit,
}: ColunaPessoaProps) {
  const tarefasOrdenadas = useMemo(() => sortTarefasByPriority(tarefas), [tarefas])

  const concluidas = useMemo(
    () => tarefas.filter((t) => t.status === "CONCLUIDA").length,
    [tarefas]
  )
  const atrasadas = useMemo(
    () => tarefas.filter((t) => isTaskAtrasada(t)).length,
    [tarefas]
  )
  const concluidasHoje = useMemo(() => {
    const hoje = new Date().toDateString()
    return tarefas.filter(
      (t) => t.completedAt && new Date(t.completedAt).toDateString() === hoje
    ).length
  }, [tarefas])

  const total = tarefas.length
  const produtividade = total > 0 ? Math.round((concluidas / total) * 100) : 0
  const inicial = nome.charAt(0).toUpperCase()

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                {avatarUrl ? undefined : inicial}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold truncate">{nome}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {atrasadas > 0 && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-xs bg-red-500/10 text-red-600 border-red-500/20 flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {atrasadas}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{atrasadas} tarefa{atrasadas > 1 ? "s" : ""} atrasada{atrasadas > 1 ? "s" : ""}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <span className="text-xs text-muted-foreground">
              {concluidas}/{total}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              produtividade === 100
                ? "bg-emerald-500"
                : produtividade >= 50
                ? "bg-secondary"
                : "bg-amber-500"
            )}
            style={{ width: `${produtividade}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{produtividade}% concluído</span>
          {concluidasHoje > 0 && (
            <span className="text-emerald-600 font-medium">
              +{concluidasHoje} hoje
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex max-h-96 flex-col gap-2 flex-1 overflow-y-auto">
        {tarefasOrdenadas.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-xs text-muted-foreground">Nenhuma tarefa</p>
          </div>
        ) : (
          tarefasOrdenadas.map((tarefa) => (
            <TarefaCard
              key={tarefa.id}
              tarefa={tarefa}
              onComplete={onComplete}
              onDelete={() => onDelete(tarefa.id)}
              onEdit={() => onEdit(tarefa)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
})
