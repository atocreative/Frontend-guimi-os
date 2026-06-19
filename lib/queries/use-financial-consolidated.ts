"use client"

import { useFinanceiroConsolidado } from "@/lib/queries/use-financeiro-consolidado"

export type { ConsolidadoPayload } from "@/lib/queries/use-financeiro-consolidado"

/** Hook canônico para dados do consolidado financeiro.
 *  Cache key: ["financeiro", "consolidado", year, month1]
 *  Nunca compartilha cache com useFinancialMonthly ou useFinancialDaily. */
export function useFinancialConsolidated(year: number, month1: number) {
  return useFinanceiroConsolidado(year, month1)
}
