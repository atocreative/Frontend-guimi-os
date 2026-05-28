// ─── Contract types — shape produced by /api/comercial/snapshot-history BFF ──

export interface HistoryPoint {
  date: string
  leadsAtivos: number
  leadsGanhos: number
  leadsPerdidos: number
  taxaConversao?: number
  conversasAtuais?: number
  chatsSemResposta?: number
  tempoRespostaMedio?: number
}

export type HistoryGranularity = "dia" | "mes"

export interface ComercialHistory {
  granularity: HistoryGranularity
  points: HistoryPoint[]
  fallbackUsed?: boolean
}

export interface HistoryQuery {
  mes?: string
  dia?: string
}

export function buildHistoryUrl(q: HistoryQuery): string {
  const params = new URLSearchParams()
  if (q.dia) params.set("day", q.dia)
  else if (q.mes) params.set("month", q.mes)
  const qs = params.toString()
  return `/api/comercial/snapshot-history${qs ? `?${qs}` : ""}`
}
