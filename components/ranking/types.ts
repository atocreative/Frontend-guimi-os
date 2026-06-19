export interface PerformanceEntry {
  posicao: number
  userId: string
  userName: string
  jobTitle: string | null
  nivel: number
  score: number
  tarefasConcluidas: number
  tarefasNoPrazo: number
  tarefasAtrasadas: number
  tarefasPendentes: number
  activeAssignedTasksTotal?: number
  taxaConclusao: number
  checklistsConcluidos: number
  streak: number
}

export interface RankingFilters {
  period: "hoje" | "semana" | "mes" | "ano" | "personalizado"
  month: number
  year: number
}
