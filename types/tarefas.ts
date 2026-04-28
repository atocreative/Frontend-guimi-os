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
  completedAt?: string | null
  createdBy?: string | null
}

export interface ChecklistItemDB {
  id: string
  title: string
  description?: string | null
  completed: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ChecklistDB {
  id: string
  title: string
  description?: string | null
  tipo: "ABERTURA" | "FECHAMENTO"
  color?: string | null
  items: ChecklistItemDB[]
  createdAt?: string
  updatedAt?: string
}

export interface NovaChecklist {
  title: string
  description?: string | null
  tipo: "ABERTURA" | "FECHAMENTO"
}

export interface ResumoPainel {
  total: number
  concluidas: number
  pendentes: number
}
