"use client"

import { useQueries, useQuery } from "@tanstack/react-query"
import { financeiroKeys } from "./financeiro-keys"

// ─── Stale times ──────────────────────────────────────────────────────────────

const STALE_MONTHLY  = 5 * 60 * 1_000
const GC_MONTHLY     = 30 * 60 * 1_000
const STALE_LIVE     = 20 * 1_000
const GC_LIVE        = 5 * 60 * 1_000
const STALE_HISTORICO = 10 * 60 * 1_000
const GC_HISTORICO    = 60 * 60 * 1_000

// ─── Shape ────────────────────────────────────────────────────────────────────

export interface DespesaRow {
  id?: string | number
  categoria?: string | null
  descricao?: string | null
  fornecedor?: string | null
  /** valor bruto vindo do backend — pode chegar positivo; o frontend mantém negativo */
  amount?: number | null
  valor?: number | null
  data?: string | null
  dataEntrada?: string | null
  vencimento?: string | null
  [key: string]: unknown
}

export interface DespesasPayload {
  total: number
  raw: DespesaRow[]
}

export interface SaldoMesItem {
  mes: number       // 0-indexed
  ano: number
  label: string     // "Jan", "Fev", …
  entradas: number  // positivo
  despesas: number  // NEGATIVO (saída)
  saldo: number     // entradas + despesas
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isCurrentMonth(year: number, month1: number): boolean {
  const now = new Date()
  return year === now.getFullYear() && month1 === now.getMonth() + 1
}

function isTodayDate(year: number, month1: number, day: number): boolean {
  const now = new Date()
  return (
    day === now.getDate() &&
    month1 === now.getMonth() + 1 &&
    year === now.getFullYear()
  )
}

const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function buildDateRange(year: number, month1: number, day: number | null) {
  if (day) {
    const s = new Date(Date.UTC(year, month1 - 1, day))
    const e = new Date(Date.UTC(year, month1 - 1, day, 23, 59, 59, 999))
    return { startDate: s.toISOString(), endDate: e.toISOString() }
  }
  const s = new Date(Date.UTC(year, month1 - 1, 1))
  const e = new Date(Date.UTC(year, month1, 1) - 1)
  return { startDate: s.toISOString(), endDate: e.toISOString() }
}

async function fetchDespesas(
  year: number,
  month1: number,
  day: number | null
): Promise<DespesasPayload> {
  const { startDate, endDate } = buildDateRange(year, month1, day)
  const qs = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
  const res = await fetch(`/api/financeiro/despesas?${qs}`, { cache: "no-store" })
  if (!res.ok) return { total: 0, raw: [] }
  const j = (await res.json().catch(() => null)) as { total?: number; raw?: DespesaRow[] } | null
  return {
    total: Number(j?.total ?? 0),
    raw: Array.isArray(j?.raw) ? j!.raw : [],
  }
}

async function fetchEntradasTotal(year: number, month1: number): Promise<number> {
  const { startDate, endDate } = buildDateRange(year, month1, null)
  const qs = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
  const res = await fetch(`/api/financeiro/compras?${qs}`, { cache: "no-store" })
  if (!res.ok) return 0
  const j = (await res.json().catch(() => null)) as { total?: number } | null
  return Number(j?.total ?? 0)
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Despesas do mês selecionado.
 * - Histórico: 5 min stale, sem polling.
 * - Mês corrente: 20 s stale, polling 30 s.
 */
export function useDespesasMensais(year: number, month1: number) {
  const live = isCurrentMonth(year, month1)
  return useQuery<DespesasPayload>({
    queryKey: financeiroKeys.despesas.monthly(year, month1),
    queryFn: () => fetchDespesas(year, month1, null),
    staleTime: live ? STALE_LIVE : STALE_MONTHLY,
    gcTime: live ? GC_LIVE : GC_MONTHLY,
    refetchInterval: live ? 30_000 : false,
    refetchIntervalInBackground: false,
    // keepPreviousData explícito — zero piscadas ao trocar de mês
    placeholderData: (prev) => prev ?? { total: 0, raw: [] },
  })
}

/**
 * Despesas de um dia específico — só dispara quando `day` é selecionado.
 * Polling 30 s só quando `day` for hoje.
 */
export function useDespesasDiarias(year: number, month1: number, day: number | null) {
  const today = !!day && isTodayDate(year, month1, day)
  return useQuery<DespesasPayload>({
    queryKey: day
      ? financeiroKeys.despesas.daily(year, month1, day)
      : (["financeiro", "despesas", "daily", "none"] as const),
    queryFn: () =>
      day ? fetchDespesas(year, month1, day) : Promise.resolve({ total: 0, raw: [] }),
    enabled: !!day,
    staleTime: STALE_LIVE,
    gcTime: GC_LIVE,
    refetchInterval: today ? 30_000 : false,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev ?? { total: 0, raw: [] },
  })
}

/**
 * Histórico de saldo dos últimos N meses (default 5), incluindo o mês selecionado.
 * - Faz N requisições paralelas para `despesas` + `compras` (entradas) por mês.
 * - Cache longo (10 min stale) e sem polling — dados históricos não mudam rápido.
 * - Despesas chegam como SAÍDA (valor negativo).
 */
export function useSaldoHistorico(year: number, month1: number, lookback = 5) {
  const meses = Array.from({ length: lookback }, (_, i) => {
    // Começa em (current - lookback + 1) e vai até current
    const offset = lookback - 1 - i
    const d = new Date(year, month1 - 1 - offset, 1)
    return { ano: d.getFullYear(), mes1: d.getMonth() + 1, mes0: d.getMonth() }
  })

  const queries = useQueries({
    queries: meses.map(({ ano, mes1, mes0 }) => ({
      queryKey: financeiroKeys.despesas.saldoMes(ano, mes1),
      queryFn: async (): Promise<SaldoMesItem> => {
        const [desp, entradas] = await Promise.all([
          fetchDespesas(ano, mes1, null),
          fetchEntradasTotal(ano, mes1),
        ])
        const despAbs = Math.abs(Number(desp.total) || 0)
        const despesasNeg = -despAbs            // ← saída SEMPRE negativa
        const entradasNum = Number(entradas) || 0
        return {
          mes: mes0,
          ano,
          label: MESES_CURTOS[mes0],
          entradas: entradasNum,
          despesas: despesasNeg,
          saldo: entradasNum + despesasNeg,
        }
      },
      staleTime: STALE_HISTORICO,
      gcTime: GC_HISTORICO,
      refetchInterval: false as const,
      placeholderData: (prev: SaldoMesItem | undefined) => prev,
    })),
  })

  const data: SaldoMesItem[] = queries.map((q) => q.data).filter(
    (x): x is SaldoMesItem => !!x
  )
  const isLoading = queries.some((q) => q.isLoading)
  const isFetching = queries.some((q) => q.isFetching)
  return { data, isLoading, isFetching }
}
