"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { isTaskAtrasada } from "@/lib/tarefas"
import { PRIORITY_COLORS } from "@/lib/colors-config"
import type { TarefaDB, TaskPriority } from "@/types/tarefas"

const PAGE_SIZE = 5

const PRIORITY_ORDER: Record<NonNullable<TaskPriority> | "null", number> = {
  ALTA: 0,
  MEDIA: 1,
  BAIXA: 2,
  null: 3,
}

function priorityRank(p: TaskPriority): number {
  return PRIORITY_ORDER[p ?? "null"]
}

function sortTarefas(tarefas: TarefaDB[]): TarefaDB[] {
  return [...tarefas].sort((a, b) => {
    const pDiff = priorityRank(a.priority) - priorityRank(b.priority)
    if (pDiff !== 0) return pDiff
    const aDate = a.dueAt ? new Date(a.dueAt).getTime() : Infinity
    const bDate = b.dueAt ? new Date(b.dueAt).getTime() : Infinity
    return aDate - bDate
  })
}

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
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" })
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
  title = "Tarefas",
  emptyMessage = "Nenhuma tarefa pendente.",
  onConcluir,
  riscados = new Set(),
}: PainelTarefasProps) {
  const [concluindo, setConcluindo] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const sorted = sortTarefas(tarefas)
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paginated = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  async function handleConcluir(id: string) {
    if (!onConcluir) return
    setConcluindo(id)
    try {
      await onConcluir(id)
    } finally {
      setConcluindo(null)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {tarefas.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {tarefas.length} pendente{tarefas.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-0 p-0 pb-2">
        {tarefas.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">{emptyMessage}</p>
        ) : (
          <>
            <div className="space-y-1 px-4">
              {paginated.map((tarefa) => {
                const riscado = riscados.has(tarefa.id)
                const atrasada = isTaskAtrasada(tarefa)
                return (
                  <div
                    key={tarefa.id}
                    onClick={() => !riscado && concluindo === null && handleConcluir(tarefa.id)}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50",
                      concluindo === tarefa.id && "opacity-50",
                      riscado && "bg-muted/30 opacity-60",
                      atrasada && !riscado && "border-red-400/50 bg-red-500/5",
                    )}
                  >
                    {riscado || concluindo === tarefa.id ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs font-medium", riscado && "line-through text-muted-foreground")}>
                        {tarefa.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {tarefa.assignee?.name && (
                          <span className="text-[10px] text-muted-foreground">{tarefa.assignee.name}</span>
                        )}
                        {tarefa.dueAt && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatarPrazo(tarefa.dueAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {atrasada && !riscado && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-500">
                          <AlertTriangle className="h-3 w-3" />
                          Atrasada
                        </span>
                      )}
                      {tarefa.priority && (
                        <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", PRIORITY_COLORS[tarefa.priority])}>
                          {tarefa.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-2 flex items-center justify-center gap-2 px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {safePage + 1} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage === totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
