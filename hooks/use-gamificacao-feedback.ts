"use client"

import { toast } from "sonner"

export interface GamificationFeedbackPayload {
  taskTitle?: string
  pointsAwarded?: number | null
}

export function useGamificacaoFeedback() {
  function notifyTaskCompleted(payload: GamificationFeedbackPayload = {}) {
    const { taskTitle, pointsAwarded } = payload

    if (typeof pointsAwarded === "number" && pointsAwarded > 0) {
      toast.success(`+${pointsAwarded} pontos!`, {
        description: taskTitle ? `Tarefa concluída: ${taskTitle}` : "Tarefa concluída com sucesso.",
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
