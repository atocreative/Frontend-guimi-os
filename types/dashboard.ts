/**
 * Dashboard API Response Types
 * 
 * These types define the structure of data returned by the backend
 * getDashboard() endpoint. Frontend components use these types to ensure
 * type safety when rendering financial and operational metrics.
 */

export interface DashboardFinancialMetrics {
  faturamentoDia: number
  lucroBrutoDia: number
  margemBrutaDia: number
  lucroBrutoMes?: number
  lucroLiquidoMes?: number
  faturamentoMes?: number
  despesasMes?: number
}

export interface DashboardTaskMetrics {
  tarefasHoje: number
  tarefasAtrasadas: number
  tarefasConcluidas: number
  tarefasPendentes: number
}

export interface DashboardUserMetrics {
  colaboradoresAtivos: number
  usuariosTotal: number
}

export interface DashboardResponse {
  /**
   * Financial metrics for the current day and month
   * If backend is unavailable, this will be undefined
   * Frontend should show fallback value ("—", "Aguardando dados")
   */
  financeiro?: DashboardFinancialMetrics

  /**
   * Task-related metrics
   */
  tarefas?: DashboardTaskMetrics

  /**
   * User and team metrics
   */
  usuarios?: DashboardUserMetrics

  /**
   * Timestamp of when data was last fetched from source
   */
  updatedAt?: string
}

/**
 * Fallback values when API data is unavailable
 * Frontend components display these when data is null/undefined
 */
export const DASHBOARD_FALLBACK_VALUES = {
  faturamentoDia: "—",
  lucroBrutoDia: "—",
  margemBrutaDia: "—",
  descricao: "Aguardando dados",
} as const
