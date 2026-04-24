export type TaskStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA"
export type TaskPriority = "ALTA" | "MEDIA" | "BAIXA" | null

export interface UsuarioSimples {
  id: string
  name: string
  avatarUrl: string | null
  role: string
  jobTitle?: string | null
}

export interface TarefaDB {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueAt: string | null
  horario: string | null
  assigneeId: string | null
  assignee: UsuarioSimples | null
  createdAt: string
  updatedAt: string
}

export interface ResumoPainel {
  total: number
  concluidas: number
  pendentes: number
}
