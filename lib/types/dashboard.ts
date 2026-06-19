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
  dailyDataMissing?:               boolean | null
  dailyProductDataMissing?:        boolean | null
  dailyRequiresDate?:              boolean | null
  selectedDate?:                   string | null
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

export type ExecutiveAlert = {
  id: string
  area: "financeiro" | "operacao" | "comercial" | "colaboradores" | "agenda" | "tarefas" | "ranking"
  type: "danger" | "warning" | "success" | "info"
  severity: "critical" | "high" | "medium" | "low"
  score: number
  title: string
  message: string
  reason: string
  recommendation: string
  actionLabel: string
  actionHref: string
  metric: string | null
  currentValue: number | string | null
  previousValue: number | string | null
  deltaPercent: number | null
  source: string
  confidence: "high" | "medium" | "low"
}

export type AttentionItem = {
  id: string
  area: "financeiro" | "operacao" | "comercial" | "colaboradores" | "agenda" | "tarefas" | "ranking"
  type: "danger" | "warning" | "success" | "info"
  severity: "critical" | "high" | "medium" | "low"
  score: number
  title: string
  impact: string
  recommendation: string
  actionLabel: string
  actionHref: string
  confidence: "high" | "medium" | "low"
}

export type SummaryChip = {
  label: string
  value: string
  type: "success" | "warning" | "danger" | "info"
  area: string
}

export type DashboardAlertHub = {
  alertsByArea?: {
    financeiro?: ExecutiveAlert[]
    operacao?: ExecutiveAlert[]
    comercial?: ExecutiveAlert[]
    colaboradores?: ExecutiveAlert[]
    agenda?: ExecutiveAlert[]
    tarefas?: ExecutiveAlert[]
    ranking?: ExecutiveAlert[]
  }
  topAlerts?: ExecutiveAlert[]
  attentionItems?: AttentionItem[]
  summaryChips?: SummaryChip[]
  generatedAt: string
  stale: boolean
  staleReason: string | null
  syncedAt: string | null
}
