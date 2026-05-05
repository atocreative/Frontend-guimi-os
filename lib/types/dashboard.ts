export type DashboardPeriodo = {
  startDate: string
  endDate: string
}

export type DashboardGraficoItem = {
  data: string
  entradas: number
  saidas: number
  saldo: number
}

export type DashboardFinanceiroPayload = {
  lucro?: number
  margem?: string | number
  receita?: number
  despesasVariaveis?: number
}

export type DashboardFinanceiro = {
  receita?: number
  despesasVariaveis?: number
  fixedExpensesTotal?: number
  grossProfit?: number
  netProfit?: number
  payload?: DashboardFinanceiroPayload
}

export type DashboardSummary = {
  financeiro?: DashboardFinanceiro
  periodo?: DashboardPeriodo
  faturamentoDia?: number
  faturamentoMes?: number
  despesasMes?: number
  comprasMes?: number
  lucroLiquidoMes?: number
  ticketMedio?: number
  totalVendas?: number
  grafico?: DashboardGraficoItem[]
  _meta?: {
    source?: string
    filtered?: boolean
    lojaId?: string
  }
  updatedAt?: string
}
