import type { TarefaDB, TaskPriority } from "@/types/tarefas"

type DueAtValue = Date | string | null | undefined
type HorarioValue = string | null | undefined

type TarefaLike = {
  id: string
  title: string
  description: string | null
  status: TarefaDB["status"]
  priority: TaskPriority
  dueAt: Date | string | null
  horario?: string | null
  assigneeId: string | null
  assignee?: {
    id: string
    name: string
    avatarUrl: string | null
    role: string
    jobTitle?: string | null
  } | null
  createdAt: Date | string
  updatedAt: Date | string
}

export const PRIORITY_ORDER: Record<Exclude<TaskPriority, null>, number> = {
  ALTA: 0,
  MEDIA: 1,
  BAIXA: 2,
}

function getPriorityRank(priority: TaskPriority): number {
  if (!priority) return 3
  return PRIORITY_ORDER[priority]
}

function getDueTime(value: DueAtValue): number {
  if (!value) return Number.POSITIVE_INFINITY
  return new Date(value).getTime()
}

function getHorarioRank(value: HorarioValue): number {
  if (!value) return Number.POSITIVE_INFINITY
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

function getReferenceDate(referenceDate?: Date | string): Date {
  return referenceDate ? new Date(referenceDate) : new Date()
}

// Returns "YYYY-MM-DD" in BRT (America/Sao_Paulo) — lexicographically comparable.
function toBRTDateStr(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date)
}

export function isTaskDueToday(value: DueAtValue, referenceDate?: Date | string): boolean {
  if (!value) return false
  return toBRTDateStr(new Date(value)) === toBRTDateStr(getReferenceDate(referenceDate))
}

const COMPLETED_STATUSES = ["CONCLUIDA", "CONCLUIDA_ATRASADA", "CANCELADA"] as const

export function isCompletedStatus(status: string): boolean {
  return COMPLETED_STATUSES.includes(status as (typeof COMPLETED_STATUSES)[number])
}

export function normalizeTaskMetrics(tarefas: { status: string; completedAt?: string | null; dueAt?: string | null }[]) {
  const completed = tarefas.filter((t) => t.status === "CONCLUIDA" || t.status === "CONCLUIDA_ATRASADA")
  const pending = tarefas.filter((t) => t.status !== "CONCLUIDA" && t.status !== "CONCLUIDA_ATRASADA" && t.status !== "CANCELADA")
  const lateCompleted = tarefas.filter((t) => t.status === "CONCLUIDA_ATRASADA")
  return {
    total: tarefas.length,
    completedTasks: completed.length,
    lateCompletedTasks: lateCompleted.length,
    pendingTasks: pending.length,
  }
}

export function isTaskAtrasada(
  tarefa: { dueAt: DueAtValue; status: string },
  referenceDate?: Date | string
): boolean {
  if (!tarefa.dueAt) return false
  if (isCompletedStatus(tarefa.status)) return false
  return toBRTDateStr(new Date(tarefa.dueAt)) < toBRTDateStr(getReferenceDate(referenceDate))
}

export function sortTarefasByPriority<T extends { priority: TaskPriority; dueAt: DueAtValue; status: string; horario?: HorarioValue }>(
  tarefas: T[],
  referenceDate?: Date | string
): T[] {
  const hoje = getReferenceDate(referenceDate)

  function isAtrasada(t: T): boolean {
    if (!t.dueAt) return false
    if (isCompletedStatus(t.status)) return false
    return toBRTDateStr(new Date(t.dueAt)) < toBRTDateStr(hoje)
  }

  return [...tarefas].sort((a, b) => {
    const aAtrasada = isAtrasada(a)
    const bAtrasada = isAtrasada(b)
    if (aAtrasada !== bAtrasada) return aAtrasada ? -1 : 1

    const dueDiff = getDueTime(a.dueAt) - getDueTime(b.dueAt)
    if (dueDiff !== 0) return dueDiff

    const priorityDiff = getPriorityRank(a.priority) - getPriorityRank(b.priority)
    if (priorityDiff !== 0) return priorityDiff

    return getHorarioRank(a.horario) - getHorarioRank(b.horario)
  })
}

export function serializeTarefa(tarefa: TarefaLike): TarefaDB {
  return {
    id: tarefa.id,
    title: tarefa.title,
    description: tarefa.description,
    status: tarefa.status,
    priority: tarefa.priority,
    dueAt: tarefa.dueAt ? new Date(tarefa.dueAt).toISOString() : null,
    horario: tarefa.horario ?? null,
    assigneeId: tarefa.assigneeId,
    assignee: tarefa.assignee
      ? {
          id: tarefa.assignee.id,
          name: tarefa.assignee.name,
          avatarUrl: tarefa.assignee.avatarUrl,
          role: tarefa.assignee.role,
          jobTitle: tarefa.assignee.jobTitle ?? null,
        }
      : null,
    createdAt: new Date(tarefa.createdAt).toISOString(),
    updatedAt: new Date(tarefa.updatedAt).toISOString(),
  }
}
