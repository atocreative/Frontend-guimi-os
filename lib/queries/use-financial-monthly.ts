"use client"

import { useQuery } from "@tanstack/react-query"
import { getDashboardSummary } from "@/lib/services/dashboard-summary"
import type { DashboardSummary } from "@/lib/types/dashboard"

const STALE_LIVE    = 45_000
const STALE_MONTHLY = 5 * 60_000

function isCurrentMonth(year: number, month1: number): boolean {
  const now = new Date()
  return year === now.getFullYear() && month1 === now.getMonth() + 1
}

/** Busca o resumo mensal via /api/dashboard/summary.
 *  Cache isolado: ["financial", "monthly", year, month1]
 *  Nunca compartilha cache com useFinancialDaily.
 *  @param opts.initialData - valor inicial (ex: dados SSR) usado como placeholderData */
export function useFinancialMonthly(
  year: number,
  month1: number,
  opts?: { initialData?: DashboardSummary | null }
) {
  const live = isCurrentMonth(year, month1)
  return useQuery<DashboardSummary | null>({
    queryKey: ["financial", "monthly", year, month1],
    queryFn: () => getDashboardSummary({ year, month: month1 }),
    staleTime: live ? STALE_LIVE : STALE_MONTHLY,
    gcTime: live ? 5 * 60_000 : 30 * 60_000,
    refetchInterval: live ? 60_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    placeholderData: opts?.initialData ?? undefined,
  })
}
