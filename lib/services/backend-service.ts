import { backendRepository, ApiError } from "@/lib/repositories/backend-repository"
import type { TarefaDB } from "@/types/tarefas"
import type { UsuarioDB } from "@/types/usuarios"

export class BackendServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: ApiError
  ) {
    super(message)
    this.name = "BackendServiceError"
  }
}

export const backendService = {
  // Tasks
  async getTasks(): Promise<{ tasks: TarefaDB[] }> {
    try {
      return await backendRepository.getTasks()
    } catch (error) {
      if (error instanceof ApiError) {
        throw new BackendServiceError("FETCH_TASKS", `Failed to fetch tasks: ${error.message}`, error)
      }
      throw error
    }
  },

  async getTaskById(id: string): Promise<TarefaDB> {
    try {
      return await backendRepository.getTaskById(id)
    } catch (error) {
      if (error instanceof ApiError) {
        throw new BackendServiceError("FETCH_TASK", `Failed to fetch task ${id}: ${error.message}`, error)
      }
      throw error
    }
  },

  async createTask(data: { title: string; description?: string; dueAt?: string; assignedToId?: string }): Promise<TarefaDB> {
    try {
      if (!data.title || data.title.trim().length === 0) {
        throw new BackendServiceError("INVALID_TASK", "Task title is required")
      }
      return await backendRepository.createTask(data)
    } catch (error) {
      if (error instanceof BackendServiceError) throw error
      if (error instanceof ApiError) {
        throw new BackendServiceError("CREATE_TASK", `Failed to create task: ${error.message}`, error)
      }
      throw error
    }
  },

  async updateTask(id: string, data: Partial<TarefaDB>): Promise<TarefaDB> {
    try {
      return await backendRepository.updateTask(id, data)
    } catch (error) {
      if (error instanceof ApiError) {
        throw new BackendServiceError("UPDATE_TASK", `Failed to update task ${id}: ${error.message}`, error)
      }
      throw error
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await backendRepository.deleteTask(id)
    } catch (error) {
      if (error instanceof ApiError) {
        throw new BackendServiceError("DELETE_TASK", `Failed to delete task ${id}: ${error.message}`, error)
      }
      throw error
    }
  },

  // Checklists
  async getChecklists(): Promise<any> {
    try {
      return await backendRepository.getChecklists()
    } catch (error) {
      if (error instanceof ApiError) {
        throw new BackendServiceError("FETCH_CHECKLISTS", `Failed to fetch checklists: ${error.message}`, error)
      }
      throw error
    }
  },

  async createChecklist(data: any): Promise<any> {
    try {
      return await backendRepository.createChecklist(data)
    } catch (error) {
      if (error instanceof ApiError) {
        throw new BackendServiceError("CREATE_CHECKLIST", `Failed to create checklist: ${error.message}`, error)
      }
      throw error
    }
  },

  async updateChecklist(id: string, data: any): Promise<any> {
    try {
      return await backendRepository.updateChecklist(id, data)
    } catch (error) {
      if (error instanceof ApiError) {
        throw new BackendServiceError("UPDATE_CHECKLIST", `Failed to update checklist ${id}: ${error.message}`, error)
      }
      throw error
    }
  },

  // Users
  async getUsers(): Promise<{ users: UsuarioDB[] }> {
    try {
      return await backendRepository.getUsers()
    } catch (error) {
      if (error instanceof ApiError) {
        throw new BackendServiceError("FETCH_USERS", `Failed to fetch users: ${error.message}`, error)
      }
      throw error
    }
  },

  // Dashboard
  async getDashboard(): Promise<any> {
    try {
      return await backendRepository.getDashboard()
    } catch (error) {
      if (error instanceof ApiError) {
        throw new BackendServiceError("FETCH_DASHBOARD", `Failed to fetch dashboard: ${error.message}`, error)
      }
      throw error
    }
  },

  // Health
  async health(): Promise<{ status: string }> {
    try {
      return await backendRepository.health()
    } catch (error) {
      if (error instanceof ApiError) {
        throw new BackendServiceError("HEALTH_CHECK", `Health check failed: ${error.message}`, error)
      }
      throw error
    }
  },
}
