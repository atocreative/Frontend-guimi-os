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

export type ProdutosVendidosBreakdown = {
  // Status-based (preferred — novos campos do backend)
  concluidos?: number | null
  pendentes?:  number | null
  total?:      number | null
  // Legacy type-based (backward compat)
  aparelhos?:  number | null
  acessorios?: number | null
  outros?:     number | null
}

export type ComparisonItem = {
  delta: number
  direction: "up" | "down"
  label?: string | null
}

export type DashboardComparisons = {
  faturamentoMes?:      ComparisonItem | null
  totalGastos?:         ComparisonItem | null
  lucroBrutoMes?:       ComparisonItem | null
  lucroLiquidoReal?:    ComparisonItem | null
  produtosVendidosMes?: ComparisonItem | null
}

export type DashboardInsight = {
  type: "success" | "warning" | "danger" | "info"
  title: string
  message: string
  recommendation?: string | null
  value?: string | number | null
  comparison?: string | null
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
  // ── Canonical fields (from backend /api/dashboard/summary) ──
  produtosVendidosMes?:            number | null
  produtosVendidosBreakdown?:      ProdutosVendidosBreakdown | null
  produtosVendidosMeta?:           number | null
  produtosVendidosPercentual?:     number | null
  produtosVendidosDia?:            number | null
  produtosVendidosDiaBreakdown?:   ProdutosVendidosBreakdown | null
  faturamentoMes?:              number
  faturamentoDia?:              number | null
  lucroBrutoMes?:               number
  lucroBrutoDia?:               number | null
  lucroLiquidoDia?:             number | null
  lucroLiquidoReal?:            number
  totalGastos?:                 number
  comparisons?:                 DashboardComparisons | null
  insights?:                    DashboardInsight[] | null
  stale?:                       boolean | null
  staleReason?:                 string | null
  syncedAt?:                    string | null

  // ── Backward-compat aliases ──
  financeiro?:           DashboardFinanceiro
  periodo?:              DashboardPeriodo
  despesasMes?:          number
  comprasMes?:           number
  lucroOperacionalMes?:  number
  lucroLiquidoMes?:      number
  margemBruta?:          number
  margemLiquida?:        number
  ticketMedio?:          number
  totalVendas?:          number
  grafico?:              DashboardGraficoItem[]
  sourceType?:           "CSV" | "API" | string
  sources?:              Record<string, string> | null
  _meta?: {
    source?:     string
    sourceType?: "CSV" | "API" | string
    isStable?:   boolean
    filtered?:   boolean
    lojaId?:     string
  }
  updatedAt?: string
}
