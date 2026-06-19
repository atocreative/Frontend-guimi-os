"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Circle, Clock } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { isTaskDueToday, sortTarefasByPriority } from "@/lib/tarefas"
import { PRIORITY_COLORS } from "@/lib/colors-config"
import type { TarefaDB, TaskPriority } from "@/types/tarefas"

function getDashboardPriorityTasks(tarefas: TarefaDB[], limit = 5): TarefaDB[] {
  return sortTarefasByPriority(tarefas).slice(0, limit)
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
  compact?: boolean
  totalPendentes?: number
}

interface TarefaRowProps {
  tarefa: TarefaDB
  riscado: boolean
  atrasada: boolean
  concluindo: string | null
  onConcluir: (id: string) => void
}

function TarefaRow({ tarefa, riscado, atrasada, concluindo, onConcluir }: TarefaRowProps) {
  const PRIORITY_LABEL: Record<string, string> = { ALTA: "Alta", MEDIA: "Média", BAIXA: "Baixa" }

  return (
    <div
      onClick={() => !riscado && concluindo === null && onConcluir(tarefa.id)}
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
        <p className={cn("text-xs font-medium leading-snug", riscado && "line-through text-muted-foreground")}>
          {tarefa.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {tarefa.assignee?.name && (
            <span className="text-[10px] text-muted-foreground">{tarefa.assignee.name}</span>
          )}
          {tarefa.dueAt && (
            <span className={cn(
              "flex items-center gap-0.5 text-[10px]",
              atrasada && !riscado ? "text-red-500 font-medium" : "text-muted-foreground"
            )}>
              <Clock className="h-2.5 w-2.5" />
              {formatarPrazo(tarefa.dueAt)}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {atrasada && !riscado && (
          <Badge variant="destructive" className="px-1.5 py-0 text-[10px] gap-0.5">
            <AlertTriangle className="h-2.5 w-2.5" />
            Atrasada
          </Badge>
        )}
        {tarefa.priority && (
          <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", PRIORITY_COLORS[tarefa.priority])}>
            {PRIORITY_LABEL[tarefa.priority] ?? tarefa.priority}
          </Badge>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ label, count, variant = "default" }: { label: string; count: number; variant?: "default" | "danger" }) {
  if (variant === "danger") {
    return (
      <div className="flex items-center gap-2 px-4 pt-3 pb-1.5 bg-red-500/5 border-y border-red-500/10 mt-1">
        <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">
          {label}
        </span>
        <Badge variant="destructive" className="text-[10px] h-4 px-1.5 ml-auto">
          {count}
        </Badge>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 px-4 pt-3 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground">({count})</span>
    </div>
  )
}

export function PainelTarefas({
  tarefas,
  title = "Tarefas",
  emptyMessage = "Nenhuma tarefa pendente.",
  onConcluir,
  riscados = new Set(),
  compact = false,
  totalPendentes,
}: PainelTarefasProps) {
  const [concluindo, setConcluindo] = useState<string | null>(null)

  const now = new Date()

  async function handleConcluir(id: string) {
    if (!onConcluir) return
    setConcluindo(id)
    try {
      await onConcluir(id)
    } finally {
      setConcluindo(null)
    }
  }

  // ── COMPACT MODE (dashboard) ────────────────────────────────────────────────
  if (compact) {
    const priorityList = getDashboardPriorityTasks(tarefas, 5)
    const total = totalPendentes ?? tarefas.length
    const atrasadasCount = tarefas.filter((t) => t.status === "EXPIRADA").length

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm font-semibold">Tarefas prioritárias</CardTitle>
            <div className="flex items-center gap-1.5">
              {atrasadasCount > 0 && (
                <Badge variant="destructive" className="text-[10px] gap-0.5">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {atrasadasCount} atrasada{atrasadasCount !== 1 ? "s" : ""}
                </Badge>
              )}
              {total > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {total} pendente{total !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {priorityList.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Nenhuma tarefa prioritária agora.
            </p>
          ) : (
            <div className="space-y-1 px-4 pt-1 pb-1">
              {priorityList.map((tarefa) => {
                const atrasada = tarefa.status === "EXPIRADA"
                return (
                  <TarefaRow
                    key={tarefa.id}
                    tarefa={tarefa}
                    riscado={riscados.has(tarefa.id)}
                    atrasada={atrasada}
                    concluindo={concluindo}
                    onConcluir={handleConcluir}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="px-4 py-2 border-t">
          <Link
            href="/agenda"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Ver todas →
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // ── FULL MODE (agenda e tarefas) ────────────────────────────────────────────
  const atrasadas = sortTarefasByPriority(tarefas.filter((t) => t.status === "EXPIRADA"))
  const hoje = sortTarefasByPriority(
    tarefas.filter((t) => t.status !== "EXPIRADA" && isTaskDueToday(t.dueAt, now))
  )
  const futuras = sortTarefasByPriority(
    tarefas.filter((t) => t.status !== "EXPIRADA" && !isTaskDueToday(t.dueAt, now))
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-1.5">
            {atrasadas.length > 0 && (
              <Badge variant="destructive" className="text-[10px] gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                {atrasadas.length} atrasada{atrasadas.length !== 1 ? "s" : ""}
              </Badge>
            )}
            {tarefas.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {tarefas.length} pendente{tarefas.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-3">
        {tarefas.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">{emptyMessage}</p>
        ) : (
          <>
            {atrasadas.length > 0 && (
              <div className="mb-1">
                <SectionHeader label="Atrasadas" count={atrasadas.length} variant="danger" />
                <div className="space-y-1 px-4 pt-1.5 pb-1">
                  {atrasadas.map((tarefa) => (
                    <TarefaRow
                      key={tarefa.id}
                      tarefa={tarefa}
                      riscado={riscados.has(tarefa.id)}
                      atrasada
                      concluindo={concluindo}
                      onConcluir={handleConcluir}
                    />
                  ))}
                </div>
              </div>
            )}

            {hoje.length > 0 && (
              <>
                <SectionHeader label="Hoje" count={hoje.length} />
                <div className="space-y-1 px-4 pb-1">
                  {hoje.map((tarefa) => (
                    <TarefaRow
                      key={tarefa.id}
                      tarefa={tarefa}
                      riscado={riscados.has(tarefa.id)}
                      atrasada={false}
                      concluindo={concluindo}
                      onConcluir={handleConcluir}
                    />
                  ))}
                </div>
              </>
            )}

            {futuras.length > 0 && (
              <>
                <SectionHeader label="Futuras" count={futuras.length} />
                <div className="space-y-1 px-4 pb-1">
                  {futuras.map((tarefa) => (
                    <TarefaRow
                      key={tarefa.id}
                      tarefa={tarefa}
                      riscado={riscados.has(tarefa.id)}
                      atrasada={false}
                      concluindo={concluindo}
                      onConcluir={handleConcluir}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
