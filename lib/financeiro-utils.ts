/**
 * Utilitários financeiros — funções puras, sem side-effects, sem chamadas HTTP
 */

export interface SalesFilters {
  startDate: string
  endDate: string
  status?: string[]
}

export interface SaleItem {
  preco?: number
  valor?: number
  amount?: number
  totalPrice?: number
  price?: number
}

/**
 * Retorna o range ISO do mês corrente (ou do mês passado com offset=-1)
 */
export function getMonthRange(offset = 0, base = new Date()): { startDate: string; endDate: string } {
  const year = base.getFullYear()
  const month = base.getMonth() + offset

  const start = new Date(year, month, 1, 0, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

/**
 * Monta os query params para o endpoint de vendas do backend/FoneNinja
 */
export function buildSalesFilters({ startDate, endDate }: { startDate: string; endDate: string }): SalesFilters {
  return {
    startDate,
    endDate,
    status: ["completed", "pending", "canceled"],
  }
}

/**
 * Calcula receita total de um array de vendas.
 * Tenta múltiplos campos canônicos sem fallback silencioso.
 */
export function calculateRevenue(sales: SaleItem[]): number {
  return sales.reduce((acc, sale) => {
    const value =
      sale.preco ??
      sale.valor ??
      sale.amount ??
      sale.totalPrice ??
      sale.price ??
      0
    return acc + Number(value)
  }, 0)
}

/**
 * Serializa SalesFilters para URLSearchParams
 */
export function filtersToSearchParams(filters: SalesFilters): URLSearchParams {
  const params = new URLSearchParams()
  params.set("startDate", filters.startDate)
  params.set("endDate", filters.endDate)
  if (filters.status) {
    filters.status.forEach((s) => params.append("status", s))
  }
  return params
}
