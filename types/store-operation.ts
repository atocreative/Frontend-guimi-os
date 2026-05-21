export type StoreStatus = "ABERTA" | "FECHADA" | "ABERTA_COM_ALERTA" | "FECHADA_COM_ALERTA"

export interface StoreOperator {
  id: string
  name: string
  avatarUrl?: string | null
}

export interface StoreOperation {
  id: string
  status: StoreStatus
  openedAt: string
  openedBy: StoreOperator
  closedAt: string | null
  closedBy: StoreOperator | null
  durationMinutes: number | null
  notes: string | null
  createdAt: string
}

export interface StoreStatusResponse {
  status: StoreStatus
  currentOperation: StoreOperation | null
  lastOperation: StoreOperation | null
}

export interface StoreHistoryResponse {
  data: StoreOperation[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}
