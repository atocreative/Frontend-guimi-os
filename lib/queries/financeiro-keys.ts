/**
 * Query keys do dashboard de DESPESAS (modo despesas-only — /processos).
 * Cada bucket é totalmente isolado para evitar invalidação cruzada.
 *
 *   despesas.monthly   ≠ despesas.daily ≠ despesas.historico
 */
export const financeiroKeys = {
  despesas: {
    monthly: (year: number, month: number) =>
      ["financeiro", "despesas", "monthly", year, month] as const,

    daily: (year: number, month: number, day: number) =>
      ["financeiro", "despesas", "daily", year, month, day] as const,

    historico: (year: number, month: number, lookback: number) =>
      ["financeiro", "despesas", "historico", year, month, lookback] as const,

    /** chave individual por mês usada na agregação histórica (5 fetches paralelos) */
    saldoMes: (year: number, month: number) =>
      ["financeiro", "despesas", "saldo-mes", year, month] as const,
  },
} as const
