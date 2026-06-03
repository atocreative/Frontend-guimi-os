"use client"

import { useQuery } from "@tanstack/react-query"

export interface ConsolidadoCategoria {
  categoria: string
  valor: number   // magnitude positiva
  count: number
  isTax: boolean
}

export interface ConsolidadoBreakdownFN {
  revenue: number
  grossProfit: number
  operationalProfit: number
  netProfit: number
  sourceType: string | null
  locked: boolean
  hasData: boolean
  updatedAt: string | null
}

export interface ConsolidadoBreakdownMA {
  administrativeExpenses: number
  taxes: number
  categories: ConsolidadoCategoria[]
  count: number
}

/** Canonical payload returned by GET /api/financeiro/consolidado.
 *  Source: backend/src/services/financial-consolidation.service.js
 *  Frontend NEVER recalculates — only renders these fields. */
export interface ConsolidadoPayload {
  month: number
  year: number
  period: string

  revenue: number
  grossProfit: number
  operationalProfit: number
  netProfit: number
  administrativeExpenses: number
  fixedExpenses: number
  operationalExpenses?: number   // canonical "Despesas Operacionais" (snapshot)
  totalExpense?: number          // canonical "Total Despesas" (snapshot, singular)
  totalExpenses?: number         // alias retrocompat (algumas versões do backend usam plural)
  burnRate?: number              // canonical "Burn Rate" (snapshot)
  taxes: number
  realCompanyProfit: number
  realMargin: number

  breakdown: {
    fn: ConsolidadoBreakdownFN
    meuAssessor: ConsolidadoBreakdownMA
  }

  meta?: {
    formula?: string
    generatedAt?: string
  }
}

const STALE_LIVE    = 20_000
const STALE_MONTHLY = 5 * 60_000
const GC_LIVE       = 5 * 60_000
const GC_MONTHLY    = 30 * 60_000

function isCurrentMonth(year: number, month1: number): boolean {
  const now = new Date()
  return year === now.getFullYear() && month1 === now.getMonth() + 1
}

async function fetchConsolidado(year: number, month1: number): Promise<ConsolidadoPayload | null> {
  const params = new URLSearchParams({ month: String(month1), year: String(year) })
  const res = await fetch(`/api/financeiro/consolidado?${params}`, { cache: "no-store" })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

export function useFinanceiroConsolidado(year: number, month1: number) {
  const live = isCurrentMonth(year, month1)
  return useQuery<ConsolidadoPayload | null>({
    queryKey: ["financeiro", "consolidado", year, month1],
    queryFn: () => fetchConsolidado(year, month1),
    staleTime: live ? STALE_LIVE : STALE_MONTHLY,
    gcTime: live ? GC_LIVE : GC_MONTHLY,
    refetchInterval: live ? 30_000 : false,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev ?? null,
  })
}
