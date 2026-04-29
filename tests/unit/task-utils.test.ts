import {
  sortTarefasByPriority,
  isTaskOverdue,
  isTaskDueToday,
  getPriorityValue,
  getTaskStatusColor,
  getTaskStatusLabel,
} from "@/lib/task-utils"
import type { TarefaDB } from "@/types/tarefas"

describe("Task Utils", () => {
  describe("sortTarefasByPriority", () => {
    it("should sort tasks by priority (high -> low)", () => {
      const tasks: TarefaDB[] = [
        { id: "1", title: "Low", priority: "BAIXA", status: "PENDENTE" } as any,
        { id: "2", title: "High", priority: "ALTA", status: "PENDENTE" } as any,
        { id: "3", title: "Medium", priority: "MEDIA", status: "PENDENTE" } as any,
      ]

      const sorted = sortTarefasByPriority(tasks)
      expect(sorted[0].id).toBe("2") // ALTA
      expect(sorted[1].id).toBe("3") // MEDIA
      expect(sorted[2].id).toBe("1") // BAIXA
    })

    it("should sort tasks by due date when priority is the same", () => {
      const today = new Date()
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

      const tasks: TarefaDB[] = [
        { id: "1", title: "Tomorrow", priority: "ALTA", status: "PENDENTE", dueAt: tomorrow } as any,
        { id: "2", title: "Today", priority: "ALTA", status: "PENDENTE", dueAt: today } as any,
      ]

      const sorted = sortTarefasByPriority(tasks)
      expect(sorted[0].id).toBe("2") // Today comes first
      expect(sorted[1].id).toBe("1") // Tomorrow comes second
    })
  })

  describe("isTaskOverdue", () => {
    it("should return true for past dates", () => {
      const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
      expect(isTaskOverdue(yesterday)).toBe(true)
    })

    it("should return false for future dates", () => {
      const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
      expect(isTaskOverdue(tomorrow)).toBe(false)
    })

    it("should return false for null/undefined", () => {
      expect(isTaskOverdue(null)).toBe(false)
      expect(isTaskOverdue(undefined as any)).toBe(false)
    })
  })

  describe("isTaskDueToday", () => {
    it("should return true for today", () => {
      const today = new Date()
      expect(isTaskDueToday(today)).toBe(true)
    })

    it("should return false for other dates", () => {
      const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
      expect(isTaskDueToday(tomorrow)).toBe(false)
    })

    it("should return false for null/undefined", () => {
      expect(isTaskDueToday(null)).toBe(false)
    })
  })

  describe("getPriorityValue", () => {
    it("should return correct priority values", () => {
      expect(getPriorityValue("ALTA")).toBe(1)
      expect(getPriorityValue("MÉDIA")).toBe(2)
      expect(getPriorityValue("BAIXA")).toBe(3)
      expect(getPriorityValue("UNKNOWN")).toBe(999)
      expect(getPriorityValue(undefined)).toBe(999)
    })
  })

  describe("getTaskStatusColor", () => {
    it("should return correct status colors", () => {
      expect(getTaskStatusColor("CONCLUIDA")).toBe("bg-green-500")
      expect(getTaskStatusColor("EM_ANDAMENTO")).toBe("bg-blue-500")
      expect(getTaskStatusColor("PENDENTE")).toBe("bg-yellow-500")
      expect(getTaskStatusColor("UNKNOWN")).toBe("bg-gray-500")
    })
  })

  describe("getTaskStatusLabel", () => {
    it("should return correct status labels", () => {
      expect(getTaskStatusLabel("CONCLUIDA")).toBe("Concluída")
      expect(getTaskStatusLabel("EM_ANDAMENTO")).toBe("Em Andamento")
      expect(getTaskStatusLabel("PENDENTE")).toBe("Pendente")
      expect(getTaskStatusLabel("UNKNOWN")).toBe("Desconhecido")
    })
  })
})
