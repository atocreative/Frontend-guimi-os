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
  lucroLiquidoDia?: number
  faturamentoMes?: number
  despesasMes?: number        // COGS + fixedExpenses
  comprasMes?: number
  lucroOperacionalMes?: number // grossProfit (revenue - COGS)
  lucroLiquidoMes?: number    // netProfit (grossProfit - fixedExpenses)
  margemBruta?: number        // grossProfit / revenue * 100
  margemLiquida?: number      // netProfit / revenue * 100
  ticketMedio?: number
  totalVendas?: number
  grafico?: DashboardGraficoItem[]
  sourceType?: "CSV" | "API" | string
  _meta?: {
    source?: string
    sourceType?: "CSV" | "API" | string
    filtered?: boolean
    lojaId?: string
  }
  updatedAt?: string
}
