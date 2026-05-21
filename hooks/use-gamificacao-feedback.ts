"use client"

import { toast } from "sonner"

export interface GamificationFeedbackPayload {
  taskTitle?: string
  pointsAwarded?: number | null
  isLate?: boolean
}

export function useGamificacaoFeedback() {
  function notifyTaskCompleted(payload: GamificationFeedbackPayload = {}) {
    const { taskTitle, pointsAwarded, isLate } = payload

    if (typeof pointsAwarded === "number" && pointsAwarded > 0) {
      const efficiency = isLate ? "Conclusão atrasada — 50%" : "Conclusão perfeita — 100%"
      const base = taskTitle ? `${taskTitle}` : "Tarefa concluída"
      toast.success(`+${pointsAwarded} pontos!`, {
        description: `${base} · ${efficiency}`,
      })
      return
    }

    toast.success("Tarefa concluída!", {
      description: taskTitle ? `${taskTitle} foi marcada como concluída.` : "A tarefa foi marcada como concluída.",
    })
  }

  function notifyTaskCompletionError() {
    toast.error("Não foi possível concluir a tarefa.", {
      description: "Tente novamente em instantes.",
    })
  }

  return {
    notifyTaskCompleted,
    notifyTaskCompletionError,
  }
}
