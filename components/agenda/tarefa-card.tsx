"use client"

import { memo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Calendar,
  Pencil,
  Trash2,
  ExternalLink,
  User,
  Trophy,
  RefreshCw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { isTaskAtrasada } from "@/lib/tarefas"
import { useConfirmDialog } from "@/context/confirm-dialog-context"
import type { TarefaDB } from "@/types/tarefas"

const PRIORITY_LABEL: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
}

const PRIORITY_BADGE_COLOR: Record<string, string> = {
  ALTA: "bg-red-500/10 text-red-600 border-red-500/20",
  MEDIA: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  BAIXA: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
}

const MIN_LATE_REASON = 50

function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

interface TarefaCardProps {
  tarefa: TarefaDB
  onComplete: (id: string, lateReason?: string) => void
  onDelete: () => void
  onEdit: () => void
}

export const TarefaCard = memo(function TarefaCard({
  tarefa,
  onComplete,
  onDelete,
  onEdit,
}: TarefaCardProps) {
  const concluida = tarefa.status === "CONCLUIDA" || tarefa.status === "CONCLUIDA_ATRASADA"
  const atrasada = isTaskAtrasada(tarefa)
  const { confirm } = useConfirmDialog()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lateDialogOpen, setLateDialogOpen] = useState(false)
  const [lateReason, setLateReason] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmingLate, setConfirmingLate] = useState(false)

  const lateReasonValid = lateReason.trim().length >= MIN_LATE_REASON

  const prazoFormatado = tarefa.dueAt
    ? new Date(tarefa.dueAt).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
      })
    : null

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (concluida) return
    if (atrasada) {
      setLateReason("")
      setLateDialogOpen(true)
    } else {
      setConfirmOpen(true)
    }
  }

  function handleCardClick() {
    setSheetOpen(true)
  }

  async function handleDelete(event: React.MouseEvent) {
    event.stopPropagation()
    const confirmed = await confirm({
      title: "Deletar tarefa",
      description: `Tem certeza que deseja deletar "${tarefa.title}"? Esta ação não pode ser desfeita.`,
      confirmText: "Deletar",
      cancelText: "Cancelar",
      isDangerous: true,
    })
    if (confirmed) onDelete()
  }

  function handleEdit(event: React.MouseEvent) {
    event.stopPropagation()
    onEdit()
  }

  async function handleConfirmLate() {
    if (!lateReasonValid) return
    setConfirmingLate(true)
    try {
      await onComplete(tarefa.id, lateReason.trim())
      setLateDialogOpen(false)
      setLateReason("")
    } finally {
      setConfirmingLate(false)
    }
  }

  return (
    <>
      {/* Card */}
      <div
        onClick={handleCardClick}
        className={cn(
          "group flex items-start gap-3 rounded-lg px-3 py-2.5 border cursor-pointer hover:bg-muted/50 transition-colors",
          concluida && "opacity-60 bg-muted/30",
          atrasada && !concluida && "border-red-500/30 bg-red-500/5"
        )}
      >
        <button
          onClick={handleCheckboxClick}
          disabled={concluida}
          aria-label={concluida ? "Tarefa concluída" : "Concluir tarefa"}
          className="mt-0.5 shrink-0 rounded p-0.5 hover:bg-muted transition-colors disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {concluida ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-xs font-medium leading-snug",
              concluida && "line-through text-muted-foreground"
            )}
          >
            {tarefa.title}
          </p>
          {tarefa.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {tarefa.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {prazoFormatado && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {prazoFormatado}
              </div>
            )}
            {tarefa.isRecurring && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                {tarefa.recurrenceType === "DAILY" ? "Diária" : tarefa.recurrenceType === "WEEKLY" ? "Semanal" : "Mensal"}
              </span>
            )}
            {atrasada && !concluida && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                <AlertTriangle className="h-3 w-3" />
                Atrasada
              </span>
            )}
            {concluida && (
              <Badge variant="outline" className="px-1.5 py-0 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Concluída
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {tarefa.priority && (
            <Badge
              variant="outline"
              className={cn("px-1.5 py-0 text-xs", PRIORITY_BADGE_COLOR[tarefa.priority])}
            >
              {PRIORITY_LABEL[tarefa.priority] ?? tarefa.priority}
            </Badge>
          )}
          {!concluida && (
            <>
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
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setSheetOpen(true) }}
            className="rounded p-0.5 opacity-0 transition-all group-hover:opacity-100 hover:text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Ver detalhes"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* AlertDialog — conclusão normal */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar conclusão da tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Após concluir esta tarefa, ela não poderá mais ser editada ou removida.
              Ela ficará disponível apenas no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                onComplete(tarefa.id)
              }}
            >
              Confirmar conclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog — conclusão de tarefa atrasada */}
      <Dialog open={lateDialogOpen} onOpenChange={(v) => { if (!confirmingLate) setLateDialogOpen(v) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Concluir tarefa atrasada
            </DialogTitle>
            <DialogDescription>
              Esta tarefa está atrasada. Para concluí-la, informe a justificativa do atraso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Justificativa do atraso *</p>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  lateReasonValid ? "text-emerald-600" : "text-muted-foreground"
                )}
              >
                {lateReason.trim().length}/{MIN_LATE_REASON}
              </span>
            </div>
            <Textarea
              value={lateReason}
              onChange={(e) => setLateReason(e.target.value)}
              placeholder="Descreva o motivo do atraso na conclusão desta tarefa..."
              rows={4}
              className="resize-none"
              autoFocus
            />
            {lateReason.trim().length > 0 && !lateReasonValid && (
              <p className="text-xs text-muted-foreground">
                Mínimo de {MIN_LATE_REASON} caracteres.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLateDialogOpen(false)}
              disabled={confirmingLate}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmLate}
              disabled={!lateReasonValid || confirmingLate}
            >
              {confirmingLate ? "Concluindo..." : "Confirmar conclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet — detalhes da tarefa */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" aria-describedby={undefined} className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex flex-wrap gap-2 mb-2">
              {concluida ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Concluída
                </Badge>
              ) : atrasada ? (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Atrasada
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Pendente
                </Badge>
              )}
              {tarefa.priority && (
                <Badge variant="outline" className={cn(PRIORITY_BADGE_COLOR[tarefa.priority])}>
                  {PRIORITY_LABEL[tarefa.priority] ?? tarefa.priority}
                </Badge>
              )}
            </div>
            <SheetTitle className="text-base font-semibold leading-snug pr-8">
              {tarefa.title}
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Descrição */}
            {tarefa.description && (
              <>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Descrição
                  </p>
                  <div className="rounded-lg bg-muted/50 border px-4 py-3">
                    <p className="text-sm leading-relaxed">{tarefa.description}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Responsável */}
            {tarefa.assignee && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Responsável
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tarefa.assignee.name}</p>
                      {tarefa.assignee.jobTitle && (
                        <p className="text-xs text-muted-foreground">{tarefa.assignee.jobTitle}</p>
                      )}
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Datas */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Datas
              </p>
              <div className="grid grid-cols-2 gap-3">
                {tarefa.dueAt && (
                  <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground mb-0.5">Prazo</p>
                    <p className={cn("text-sm font-medium", atrasada && !concluida && "text-red-500")}>
                      {formatDate(tarefa.dueAt)}
                    </p>
                  </div>
                )}
                <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground mb-0.5">Criada em</p>
                  <p className="text-sm font-medium">{formatDate(tarefa.createdAt)}</p>
                </div>
                {tarefa.completedAt && (
                  <div className="rounded-lg border bg-emerald-500/5 border-emerald-500/20 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground mb-0.5">Concluída em</p>
                    <p className="text-sm font-medium text-emerald-600">
                      {formatDate(tarefa.completedAt, true)}
                    </p>
                  </div>
                )}
                {tarefa.completedByName && (
                  <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground mb-0.5">Concluída por</p>
                    <p className="text-sm font-medium">{tarefa.completedByName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recorrência */}
            {tarefa.isRecurring && tarefa.recurrenceType && tarefa.recurrenceType !== "NONE" && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recorrência
                  </p>
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                    <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm">
                      {tarefa.recurrenceType === "DAILY" && `Diária${tarefa.recurrenceInterval && tarefa.recurrenceInterval > 1 ? ` (a cada ${tarefa.recurrenceInterval} dias)` : ""}`}
                      {tarefa.recurrenceType === "WEEKLY" && `Semanal${tarefa.recurrenceInterval && tarefa.recurrenceInterval > 1 ? ` (a cada ${tarefa.recurrenceInterval} semanas)` : ""}`}
                      {tarefa.recurrenceType === "MONTHLY" && `Mensal${tarefa.recurrenceInterval && tarefa.recurrenceInterval > 1 ? ` (a cada ${tarefa.recurrenceInterval} meses)` : ""}`}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Gamificação */}
            {tarefa.pointsAwarded != null && tarefa.pointsAwarded > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Gamificação
                  </p>
                  <div className="flex items-center gap-3 rounded-lg border bg-amber-500/5 border-amber-500/20 px-4 py-3">
                    <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-600">
                        +{tarefa.pointsAwarded} pontos
                      </p>
                      <p className="text-xs text-muted-foreground">concedidos por conclusão</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Justificativa do atraso */}
            {tarefa.lateReason && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Justificativa do atraso
                  </p>
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <p className="text-sm leading-relaxed">{tarefa.lateReason}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
})
