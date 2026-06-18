"use client"

import { useQuery } from "@tanstack/react-query"
import { getDashboardSummary } from "@/lib/services/dashboard-summary"
import type { DashboardSummary } from "@/lib/types/dashboard"

const STALE_TODAY   = 30_000
const STALE_PAST    = 5 * 60_000

function isToday(year: number, month1: number, day: number): boolean {
  const now = new Date()
  return year === now.getFullYear() && month1 === now.getMonth() + 1 && day === now.getDate()
}

/** Busca o resumo de um dia específico via /api/dashboard/summary?day=D.
 *  Cache isolado: ["financial", "daily", year, month1, day]
 *  Nunca compartilha cache com useFinancialMonthly.
 *  Desabilitado quando day = null. */
export function useFinancialDaily(year: number, month1: number, day: number | null) {
  const live = day !== null && isToday(year, month1, day)
  return useQuery<DashboardSummary | null>({
    queryKey: ["financial", "daily", year, month1, day],
    queryFn: () => day !== null ? getDashboardSummary({ year, month: month1, day }) : null,
    enabled: day !== null,
    staleTime: live ? STALE_TODAY : STALE_PAST,
    gcTime: live ? 5 * 60_000 : 30 * 60_000,
    refetchInterval: live ? 60_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })
}
