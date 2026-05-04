"use client"

import { memo, useState } from "react"
import { AlertTriangle, CheckCircle2, Circle, Clock, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { isTaskAtrasada } from "@/lib/tarefas"
import { useConfirmDialog } from "@/context/confirm-dialog-context"
import type { TarefaDB } from "@/types/tarefas"

const prioridadeCor: Record<Exclude<TarefaDB["priority"], null>, string> = {
  ALTA: "bg-red-500/10 text-red-600 border-red-500/20",
  MEDIA: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  BAIXA: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
}

interface TarefaCardProps {
  tarefa: TarefaDB
  onToggle: () => void
  onDelete: () => void
  onEdit: () => void
}

export const TarefaCard = memo(function TarefaCard({ tarefa, onToggle, onDelete, onEdit }: TarefaCardProps) {
  const concluida = tarefa.status === "CONCLUIDA"
  const atrasada = isTaskAtrasada(tarefa)
  const { confirm } = useConfirmDialog()

  async function handleDelete(event: React.MouseEvent) {
    event.stopPropagation()
    
    const confirmed = await confirm({
      title: "Deletar tarefa",
      description: `Tem certeza que deseja deletar "${tarefa.title}"? Esta ação não pode ser desfeita.`,
      confirmText: "Deletar",
      cancelText: "Cancelar",
      isDangerous: true,
    })

    if (confirmed) {
      onDelete()
    }
  }

  function handleEdit(event: React.MouseEvent) {
    event.stopPropagation()
    onEdit()
  }

  const prazoFormatado = tarefa.dueAt
    ? new Date(tarefa.dueAt).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
      })
    : null
  const tempoInfo =
    prazoFormatado && tarefa.horario
      ? `${prazoFormatado} • ${tarefa.horario}`
      : prazoFormatado ?? tarefa.horario ?? null

  return (
    <div
      onClick={onToggle}
      className={cn(
        "group flex items-start gap-3 rounded-lg px-3 py-2 border cursor-pointer hover:bg-muted/50 transition-colors",
        concluida && "opacity-60 bg-muted/30",
        atrasada && !concluida && "border-red-400/50 bg-red-500/5"
      )}
    >
      {concluida ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      )}

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs font-medium",
          concluida && "line-through text-muted-foreground"
        )}>
          {tarefa.title}
        </p>
        {tarefa.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{tarefa.description}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {tarefa.assignee?.name && (
            <span className="text-xs text-muted-foreground">
              {tarefa.assignee.name}
            </span>
          )}
          {tempoInfo && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {tempoInfo}
            </div>
          )}
        </div>
        {(atrasada || concluida) && (
          <div className="flex items-center gap-3 mt-0.5">
            {atrasada && !concluida && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                <AlertTriangle className="h-3 w-3" />
                Atrasada
              </span>
            )}
            {concluida && (
              <span className="text-xs font-medium text-emerald-500">Concluída</span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {tarefa.priority && (
          <Badge
            variant="outline"
            className={cn("px-1.5 py-0 text-xs", prioridadeCor[tarefa.priority])}
          >
            {tarefa.priority}
          </Badge>
        )}
        <button
          onClick={handleEdit}
          className="rounded p-0.5 opacity-0 transition-all group-hover:opacity-100 hover:text-blue-500 hover:bg-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Editar tarefa"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={handleDelete}
          className="rounded p-0.5 opacity-0 transition-all group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          aria-label="Deletar tarefa"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
})
