"use client"

import { useQuery } from "@tanstack/react-query"

const STALE_MONTHLY   = 5  * 60 * 1_000
const STALE_LIVE      = 20 * 1_000
const STALE_HISTORICO = 10 * 60 * 1_000
const GC_MONTHLY      = 30 * 60 * 1_000
const GC_LIVE         = 5  * 60 * 1_000
const GC_HISTORICO    = 60 * 60 * 1_000

export const processosKeys = {
  despesas: {
    monthly : (year: number, month: number) =>
      ["processos", "despesas", "monthly", year, month] as const,
  },
  historico: (months: number) =>
    ["processos", "historico", months] as const,
} as const

export interface ProcessosDespesaItem {
  id: string
  categoria: string
  descricao: string
  amount: number       // negativo
  count: number
  data?: string | null
  [key: string]: unknown
}

export interface ProcessosDespesasPayload {
  total: number        // negativo
  totalAbs: number     // positivo
  items: ProcessosDespesaItem[]
}

export interface ProcessosSaldoMesItem {
  mes: number       // 0-indexed
  ano: number
  label: string
  entradas: number
  despesas: number  // negativo
  saldo: number
}

interface BackendHistoricoItem {
  mes: string       // "YYYY-MM"
  entradas: number
  despesas: number  // já negativo
  saldo: number
  count: number
}

const MESES_CURTOS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

function isCurrentMonth(year: number, month1: number): boolean {
  const now = new Date()
  return year === now.getFullYear() && month1 === now.getMonth() + 1
}

async function fetchProcessosDespesas(
  year: number,
  month1: number,
): Promise<ProcessosDespesasPayload> {
  const params = new URLSearchParams({ month: String(month1), year: String(year) })
  const res = await fetch(`/api/processos-financeiros/despesas?${params}`, { cache: "no-store" })
  if (!res.ok) return { total: 0, totalAbs: 0, items: [] }
  const j = (await res.json().catch(() => null)) as ProcessosDespesasPayload | null
  return j ?? { total: 0, totalAbs: 0, items: [] }
}

async function fetchProcessosHistorico(months: number): Promise<BackendHistoricoItem[]> {
  const res = await fetch(`/api/processos-financeiros/historico?months=${months}`, { cache: "no-store" })
  if (!res.ok) return []
  const j = (await res.json().catch(() => null)) as { series?: BackendHistoricoItem[] } | null
  return j?.series ?? []
}

/** Despesas mensais MeuAssessor (1 item por categoria). */
export function useProcessosDespesasMensais(year: number, month1: number) {
  const live = isCurrentMonth(year, month1)
  return useQuery<ProcessosDespesasPayload>({
    queryKey: processosKeys.despesas.monthly(year, month1),
    queryFn : () => fetchProcessosDespesas(year, month1),
    staleTime: live ? STALE_LIVE : STALE_MONTHLY,
    gcTime   : live ? GC_LIVE    : GC_MONTHLY,
    refetchInterval           : live ? 30_000 : false,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev ?? { total: 0, totalAbs: 0, items: [] },
  })
}

/**
 * Saldo histórico — 1 chamada agregada para os últimos N meses.
 * Backend devolve a série completa; filtramos para os meses ≤ (year, month1).
 */
export function useProcessosSaldoHistorico(year: number, month1: number, lookback = 5) {
  const totalMonths = Math.max(lookback + 6, 12)
  const q = useQuery<BackendHistoricoItem[]>({
    queryKey: processosKeys.historico(totalMonths),
    queryFn : () => fetchProcessosHistorico(totalMonths),
    staleTime: STALE_HISTORICO,
    gcTime   : GC_HISTORICO,
    refetchInterval: false,
    placeholderData: (prev) => prev,
  })

  const series = q.data ?? []

  // Janela de N meses até (year, month1) inclusive
  const wanted: { ano: number; mes1: number; key: string }[] = Array.from(
    { length: lookback },
    (_, i) => {
      const offset = lookback - 1 - i
      const d = new Date(year, month1 - 1 - offset, 1)
      const ano = d.getFullYear()
      const mes1 = d.getMonth() + 1
      return { ano, mes1, key: `${ano}-${String(mes1).padStart(2, "0")}` }
    },
  )

  const byKey = new Map(series.map((s) => [s.mes, s]))
  const data: ProcessosSaldoMesItem[] = wanted.map((w) => {
    const s = byKey.get(w.key)
    const entradas = s?.entradas ?? 0
    const despesas = s?.despesas ?? 0   // já negativo no backend
    const saldo    = s?.saldo    ?? 0
    return {
      mes: w.mes1 - 1,
      ano: w.ano,
      label: MESES_CURTOS[w.mes1 - 1],
      entradas,
      despesas,
      saldo,
    }
  })

  return { data, isLoading: q.isLoading, isFetching: q.isFetching }
}
