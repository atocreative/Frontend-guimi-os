import { backendService } from "@/lib/services/backend-service"
import { backendRepository, ApiError } from "@/lib/repositories/backend-repository"
import type { TarefaDB } from "@/types/tarefas"

jest.mock("@/lib/repositories/backend-repository")

describe("Backend Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getTasks", () => {
    it("should return tasks from repository", async () => {
      const mockTasks = {
        tasks: [
          { id: "1", title: "Task 1", status: "PENDENTE" } as TarefaDB,
        ],
      }

      ;(backendRepository.getTasks as jest.Mock).mockResolvedValue(mockTasks)

      const result = await backendService.getTasks()
      expect(result).toEqual(mockTasks)
      expect(backendRepository.getTasks).toHaveBeenCalled()
    })

    it("should throw BackendServiceError on repository failure", async () => {
      const apiError = new ApiError("FETCH_ERROR", 500, "Network error")
      ;(backendRepository.getTasks as jest.Mock).mockRejectedValue(apiError)

      await expect(backendService.getTasks()).rejects.toThrow("Failed to fetch tasks")
    })
  })

  describe("createTask", () => {
    it("should validate task title before creating", async () => {
      const invalidData = { title: "", description: "Test" }

      await expect(backendService.createTask(invalidData)).rejects.toThrow("Task title is required")
      expect(backendRepository.createTask).not.toHaveBeenCalled()
    })

    it("should create task with valid data", async () => {
      const validData = { title: "New Task", description: "Test" }
      const mockTask = { id: "1", ...validData, status: "PENDENTE" } as TarefaDB

      ;(backendRepository.createTask as jest.Mock).mockResolvedValue(mockTask)

      const result = await backendService.createTask(validData)
      expect(result).toEqual(mockTask)
      expect(backendRepository.createTask).toHaveBeenCalledWith(validData)
    })
  })

  describe("updateTask", () => {
    it("should update task", async () => {
      const updateData = { status: "CONCLUIDA" }
      const mockTask = { id: "1", title: "Task", ...updateData } as TarefaDB

      ;(backendRepository.updateTask as jest.Mock).mockResolvedValue(mockTask)

      const result = await backendService.updateTask("1", updateData)
      expect(result).toEqual(mockTask)
      expect(backendRepository.updateTask).toHaveBeenCalledWith("1", updateData)
    })
  })

  describe("deleteTask", () => {
    it("should delete task", async () => {
      ;(backendRepository.deleteTask as jest.Mock).mockResolvedValue(undefined)

      await backendService.deleteTask("1")
      expect(backendRepository.deleteTask).toHaveBeenCalledWith("1")
    })
  })

  describe("getDashboard", () => {
    it("should fetch dashboard data", async () => {
      const mockDashboard = {
        financeiro: { receitas: 1000, despesas: 500, lucro: 500 },
      }

      ;(backendRepository.getDashboard as jest.Mock).mockResolvedValue(mockDashboard)

      const result = await backendService.getDashboard()
      expect(result).toEqual(mockDashboard)
      expect(backendRepository.getDashboard).toHaveBeenCalled()
    })
  })

  describe("getUsers", () => {
    it("should fetch users", async () => {
      const mockUsers = {
        users: [{ id: "1", name: "User 1", email: "user@example.com" }],
      }

      ;(backendRepository.getUsers as jest.Mock).mockResolvedValue(mockUsers)

      const result = await backendService.getUsers()
      expect(result).toEqual(mockUsers)
      expect(backendRepository.getUsers).toHaveBeenCalled()
    })
  })
})
