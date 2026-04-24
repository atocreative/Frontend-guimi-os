"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Circle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { isTaskAtrasada } from "@/lib/tarefas"
import type { TarefaDB } from "@/types/tarefas"

interface PainelCompromissosProps {
  tarefas: TarefaDB[]
  emptyMessage?: string
  onConcluir?: (id: string) => Promise<boolean>
  riscados?: Set<string>
}

export function PainelCompromissos({
  tarefas = [],
  emptyMessage = "Nenhuma tarefa para hoje",
  onConcluir,
  riscados = new Set(),
}: PainelCompromissosProps) {
  const [concluindo, setConcluindo] = useState<string | null>(null)

  async function handleConcluir(id: string) {
    if (!onConcluir) return
    setConcluindo(id)
    try {
      await onConcluir(id)
    } finally {
      setConcluindo(null)
    }
  }

  const concluidos = tarefas.filter((t) => riscados.has(t.id)).length
  const total = tarefas.length
  const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Hoje</CardTitle>
          {total > 0 && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                percentual === 100
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              )}
            >
              {concluidos}/{total} — {percentual}%
            </Badge>
          )}
        </div>

        {total > 0 && (
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                percentual === 100 ? "bg-emerald-500" : "bg-amber-500"
              )}
              style={{ width: `${percentual}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="max-h-72 space-y-2 overflow-y-auto">
        {tarefas.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          tarefas.map((tarefa) => {
            const riscado = riscados.has(tarefa.id)
            const atrasada = isTaskAtrasada(tarefa)
            return (
              <div
                key={tarefa.id}
                onClick={() => !riscado && concluindo === null && handleConcluir(tarefa.id)}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-2 border cursor-pointer hover:bg-muted/50 transition-colors",
                  concluindo === tarefa.id && "opacity-50",
                  riscado && "opacity-60 bg-muted/30",
                  atrasada && !riscado && "border-red-400/50 bg-red-500/5"
                )}
              >
                {riscado || concluindo === tarefa.id ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-medium",
                    riscado && "line-through text-muted-foreground"
                  )}>
                    {tarefa.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {tarefa.assignee?.name && (
                      <span className="text-xs text-muted-foreground">
                        {tarefa.assignee.name}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {tarefa.horario ?? "Sem horário"}
                    </div>
                  </div>
                </div>
                {atrasada && !riscado && (
                  <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-red-500">
                    <AlertTriangle className="h-3 w-3" />
                    Atrasada
                  </span>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
