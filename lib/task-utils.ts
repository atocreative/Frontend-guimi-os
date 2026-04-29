import type { TarefaDB } from "@/types/tarefas"

export function isTaskOverdue(dueAt: string | null | Date): boolean {
  if (!dueAt) return false
  const due = new Date(dueAt)
  const now = new Date()
  return due < now
}

export function isTaskDueToday(dueAt: string | null | Date): boolean {
  if (!dueAt) return false
  const due = new Date(dueAt)
  const today = new Date()
  return due.toDateString() === today.toDateString()
}

export function getPriorityValue(priority?: string): number {
  switch (priority?.toUpperCase()) {
    case "ALTA":
    case "HIGH":
      return 1
    case "MÉDIA":
    case "MEDIA":
    case "MEDIUM":
      return 2
    case "BAIXA":
    case "LOW":
      return 3
    default:
      return 999
  }
}

export function sortTarefasByPriority(tarefas: TarefaDB[]): TarefaDB[] {
  return [...tarefas].sort((a, b) => {
    const priorityA = getPriorityValue(a.priority ?? undefined)
    const priorityB = getPriorityValue(b.priority ?? undefined)

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    const dueDateA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity
    const dueDateB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity

    return dueDateA - dueDateB
  })
}

export function getTaskStatusColor(status?: string): string {
  switch (status?.toUpperCase()) {
    case "CONCLUIDA":
    case "COMPLETED":
      return "bg-green-500"
    case "EM_ANDAMENTO":
    case "IN_PROGRESS":
      return "bg-blue-500"
    case "PENDENTE":
    case "PENDING":
      return "bg-yellow-500"
    default:
      return "bg-gray-500"
  }
}

export function getTaskStatusLabel(status?: string): string {
  switch (status?.toUpperCase()) {
    case "CONCLUIDA":
    case "COMPLETED":
      return "Concluída"
    case "EM_ANDAMENTO":
    case "IN_PROGRESS":
      return "Em Andamento"
    case "PENDENTE":
    case "PENDING":
      return "Pendente"
    default:
      return "Desconhecido"
  }
}
