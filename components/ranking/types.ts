export interface RankingEntry {
  posicao: number
  sellerName: string
  totalVendas: number
  faturamento: number
  ticketMedio: number
}

export interface RankingFilters {
  period: "hoje" | "semana" | "mes" | "ano" | "personalizado"
  month: number
  year: number
  seller: string
}
