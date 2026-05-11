"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Circle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { isTaskAtrasada } from "@/lib/tarefas"
import { PRIORITY_COLORS, COMPLETION_COLORS } from "@/lib/colors-config"
import type { TarefaDB } from "@/types/tarefas"

const prioridadeCor = PRIORITY_COLORS

function formatarPrazo(dueAt: string | null): string {
  if (!dueAt) return ""

  const data = new Date(dueAt)
  const hoje = new Date()
  const amanha = new Date(hoje)
  amanha.setDate(hoje.getDate() + 1)

  const dStr = data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
  const hStr = hoje.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
  const aStr = amanha.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })

  if (dStr === hStr) return "Hoje"
  if (dStr === aStr) return "Amanhã"
  return data.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  })
}

interface PainelTarefasProps {
  tarefas: TarefaDB[]
  title?: string
  emptyMessage?: string
  onConcluir?: (id: string) => Promise<boolean>
  riscados?: Set<string>
}

export function PainelTarefas({
  tarefas,
  title = "Tarefas Prioritárias",
  emptyMessage = "Nenhuma tarefa pendente.",
  onConcluir,
  riscados = new Set(),
}: PainelTarefasProps) {
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

  if (tarefas.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-xs text-muted-foreground">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
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
      <CardContent className="max-h-72 space-y-2 overflow-y-auto">
        {tarefas.map((tarefa) => {
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
                  {(tarefa.dueAt || tarefa.horario) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {[formatarPrazo(tarefa.dueAt), tarefa.horario].filter(Boolean).join(" • ")}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {atrasada && !riscado && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                    <AlertTriangle className="h-3 w-3" />
                    Atrasada
                  </span>
                )}
                {tarefa.priority && (
                  <Badge
                    variant="outline"
                    className={cn("px-1.5 py-0 text-xs", prioridadeCor[tarefa.priority])}
                  >
                    {tarefa.priority}
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
