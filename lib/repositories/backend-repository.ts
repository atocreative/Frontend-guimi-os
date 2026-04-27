import { api } from "@/lib/api-client"
import type { TarefaDB, NovaChecklist, ChecklistDB } from "@/types/tarefas"
import type { UsuarioDB } from "@/types/usuarios"

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export const backendRepository = {
  // Tasks
  async getTasks(): Promise<{ tasks: TarefaDB[] }> {
    try {
      return await api.getTasks()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch tasks"
      throw new ApiError("FETCH_TASKS_ERROR", 500, message)
    }
  },

  async getTaskById(id: string): Promise<TarefaDB> {
    try {
      return await api.getTaskById(id)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch task"
      throw new ApiError("FETCH_TASK_ERROR", 500, message)
    }
  },

  async createTask(data: { title: string; description?: string; dueAt?: string; assignedToId?: string }): Promise<TarefaDB> {
    try {
      return await api.createTask(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create task"
      throw new ApiError("CREATE_TASK_ERROR", 500, message)
    }
  },

  async updateTask(id: string, data: Partial<TarefaDB>): Promise<TarefaDB> {
    try {
      return await api.updateTask(id, data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update task"
      throw new ApiError("UPDATE_TASK_ERROR", 500, message)
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await api.deleteTask(id)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete task"
      throw new ApiError("DELETE_TASK_ERROR", 500, message)
    }
  },

  // Checklists
  async getChecklists(): Promise<{ checklists: ChecklistDB[] }> {
    try {
      return await api.getChecklists()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch checklists"
      throw new ApiError("FETCH_CHECKLISTS_ERROR", 500, message)
    }
  },

  async getChecklistById(id: string): Promise<ChecklistDB> {
    try {
      return await api.getChecklistById(id)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch checklist"
      throw new ApiError("FETCH_CHECKLIST_ERROR", 500, message)
    }
  },

  async createChecklist(data: NovaChecklist): Promise<ChecklistDB> {
    try {
      return await api.createChecklist(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create checklist"
      throw new ApiError("CREATE_CHECKLIST_ERROR", 500, message)
    }
  },

  async updateChecklist(id: string, data: Partial<ChecklistDB>): Promise<ChecklistDB> {
    try {
      return await api.updateChecklist(id, data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update checklist"
      throw new ApiError("UPDATE_CHECKLIST_ERROR", 500, message)
    }
  },

  async deleteChecklist(id: string): Promise<void> {
    try {
      await api.deleteChecklist(id)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete checklist"
      throw new ApiError("DELETE_CHECKLIST_ERROR", 500, message)
    }
  },

  // Users
  async getUsers(): Promise<{ users: UsuarioDB[] }> {
    try {
      return await api.getUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch users"
      throw new ApiError("FETCH_USERS_ERROR", 500, message)
    }
  },

  // Dashboard
  async getDashboard(): Promise<any> {
    try {
      return await api.getDashboard()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch dashboard"
      throw new ApiError("FETCH_DASHBOARD_ERROR", 500, message)
    }
  },

  // Health
  async health(): Promise<{ status: string }> {
    try {
      return await api.health()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Health check failed"
      throw new ApiError("HEALTH_CHECK_ERROR", 500, message)
    }
  },
}
