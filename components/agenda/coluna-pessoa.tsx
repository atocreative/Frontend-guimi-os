import { memo, useMemo } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { sortTarefasByPriority } from "@/lib/tarefas"
import { TarefaCard } from "./tarefa-card"
import type { TarefaDB } from "@/types/tarefas"

interface ColunaPessoaProps {
  nome: string
  avatarUrl?: string | null
  tarefas: TarefaDB[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (tarefa: TarefaDB) => void
}

export const ColunaPessoa = memo(function ColunaPessoa({
  nome,
  avatarUrl,
  tarefas,
  onToggle,
  onDelete,
  onEdit,
}: ColunaPessoaProps) {
  const tarefasOrdenadas = useMemo(() => sortTarefasByPriority(tarefas), [tarefas])
  const concluidas = useMemo(
    () => tarefas.filter((t) => t.status === "CONCLUIDA").length,
    [tarefas]
  )
  const total = tarefas.length
  const inicial = nome.charAt(0).toUpperCase()

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                {avatarUrl ? undefined : inicial}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold">{nome}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {concluidas}/{total} concluídas
          </span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all"
            style={{
              width: total > 0 ? `${(concluidas / total) * 100}%` : "0%",
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="flex max-h-96 flex-col gap-2 flex-1 overflow-y-auto">
        {tarefasOrdenadas.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-xs text-muted-foreground">Sem tarefas</p>
          </div>
        ) : (
          tarefasOrdenadas.map((tarefa) => (
            <TarefaCard
              key={tarefa.id}
              tarefa={tarefa}
              onToggle={() => onToggle(tarefa.id)}
              onDelete={() => onDelete(tarefa.id)}
              onEdit={() => onEdit(tarefa)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
})
