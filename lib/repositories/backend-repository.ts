import { api, ApiError as ClientApiError } from "@/lib/api-client"
import type { TarefaDB, NovaChecklist, ChecklistDB, ChecklistItemDB } from "@/types/tarefas"
import type { UsuarioDB } from "@/types/usuarios"
import type { DashboardResponse } from "@/types/dashboard"

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function normalizeError(error: unknown, fallbackCode: string, fallbackMessage: string) {
  if (error instanceof ClientApiError) {
    return new ApiError(
      error.code ?? fallbackCode,
      error.status,
      error.message || fallbackMessage,
      error.data
    )
  }

  if (error instanceof Error) {
    return new ApiError(fallbackCode, 500, error.message)
  }

  return new ApiError(fallbackCode, 500, fallbackMessage)
}

export const backendRepository = {
  async getTasks(): Promise<{ tasks: TarefaDB[]; total: number }> {
    try {
      return await api.getTasks()
    } catch (error) {
      throw normalizeError(error, "FETCH_TASKS_ERROR", "Falha ao buscar tarefas")
    }
  },

  async getTaskById(id: string): Promise<TarefaDB> {
    try {
      return await api.getTaskById(id)
    } catch (error) {
      throw normalizeError(error, "FETCH_TASK_ERROR", "Falha ao buscar tarefa")
    }
  },

  async createTask(data: {
    title: string
    description?: string | null
    priority?: string | null
    dueAt?: string | null
    horario?: string | null
    assigneeId?: string | null
  }): Promise<TarefaDB> {
    try {
      return await api.createTask(data)
    } catch (error) {
      throw normalizeError(error, "CREATE_TASK_ERROR", "Falha ao criar tarefa")
    }
  },

  async updateTask(id: string, data: Partial<TarefaDB>): Promise<TarefaDB> {
    try {
      return await api.updateTask(id, data)
    } catch (error) {
      throw normalizeError(error, "UPDATE_TASK_ERROR", "Falha ao atualizar tarefa")
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await api.deleteTask(id)
    } catch (error) {
      throw normalizeError(error, "DELETE_TASK_ERROR", "Falha ao deletar tarefa")
    }
  },

  async getChecklists(): Promise<{ checklists: ChecklistDB[] }> {
    try {
      return await api.getChecklists()
    } catch (error) {
      throw normalizeError(error, "FETCH_CHECKLISTS_ERROR", "Falha ao buscar checklists")
    }
  },

  async getChecklistById(id: string): Promise<ChecklistItemDB> {
    try {
      return await api.getChecklistById(id)
    } catch (error) {
      throw normalizeError(error, "FETCH_CHECKLIST_ERROR", "Falha ao buscar checklist")
    }
  },

  async createChecklist(data: NovaChecklist) {
    try {
      return await api.createChecklist(data)
    } catch (error) {
      throw normalizeError(error, "CREATE_CHECKLIST_ERROR", "Falha ao criar checklist")
    }
  },

  async updateChecklist(id: string, data: { completed: boolean }) {
    try {
      return await api.updateChecklist(id, data)
    } catch (error) {
      throw normalizeError(error, "UPDATE_CHECKLIST_ERROR", "Falha ao atualizar checklist")
    }
  },

  async getUsers(): Promise<{ users: UsuarioDB[]; total: number }> {
    try {
      return await api.getUsers()
    } catch (error) {
      throw normalizeError(error, "FETCH_USERS_ERROR", "Falha ao buscar usuários")
    }
  },

  async createUser(data: {
    name: string
    email: string
    password: string
    jobTitle: string
    role: "COLABORADOR" | "GESTOR"
  }): Promise<UsuarioDB> {
    try {
      return await api.createUser(data)
    } catch (error) {
      throw normalizeError(error, "CREATE_USER_ERROR", "Falha ao criar usuário")
    }
  },

  async getDashboard(): Promise<DashboardResponse> {
    try {
      return await api.getDashboard()
    } catch (error) {
      throw normalizeError(error, "FETCH_DASHBOARD_ERROR", "Falha ao buscar dashboard")
    }
  },

  async health(): Promise<{ status: string }> {
    try {
      return await api.getHealth()
    } catch (error) {
      throw normalizeError(error, "HEALTH_CHECK_ERROR", "Falha no health check")
    }
  },
}
