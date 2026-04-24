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

export function isTaskDueToday(value: DueAtValue): boolean {
  if (!value) return false
  return new Date(value).toDateString() === new Date().toDateString()
}

export function isTaskAtrasada(tarefa: { dueAt: DueAtValue; status: string }): boolean {
  if (!tarefa.dueAt) return false
  if (tarefa.status === "CONCLUIDA" || tarefa.status === "CANCELADA") return false
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const prazo = new Date(tarefa.dueAt)
  prazo.setHours(0, 0, 0, 0)
  return prazo < hoje
}

export function sortTarefasByPriority<T extends { priority: TaskPriority; dueAt: DueAtValue; status: string; horario?: HorarioValue }>(
  tarefas: T[]
): T[] {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  function isAtrasada(t: T): boolean {
    if (!t.dueAt) return false
    if (t.status === "CONCLUIDA" || t.status === "CANCELADA") return false
    const prazo = new Date(t.dueAt)
    prazo.setHours(0, 0, 0, 0)
    return prazo < hoje
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
