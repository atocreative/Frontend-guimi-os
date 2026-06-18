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
  lucroBrutoMes?: number       // grossProfit (revenue - COGS)
  lucroOperacionalMes?: number // operating income (grossProfit - fixedExpenses)
  lucroLiquidoMes?: number    // netProfit (operatingIncome - taxes/financial)
  margemBruta?: number        // grossProfit / revenue * 100
  margemLiquida?: number      // netProfit / revenue * 100
  ticketMedio?: number
  totalVendas?: number
  grafico?: DashboardGraficoItem[]
  sourceType?: "CSV" | "API" | string
  _meta?: {
    source?: string
    sourceType?: "CSV" | "API" | string
    isStable?: boolean
    filtered?: boolean
    lojaId?: string
  }
  updatedAt?: string
}
