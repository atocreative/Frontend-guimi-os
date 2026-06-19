"use client"

import { useQuery } from "@tanstack/react-query"
import type { DashboardAlertHub } from "@/lib/types/dashboard"

async function fetchDashboardAlertHub(
  month: number,
  year: number,
  date?: string
): Promise<DashboardAlertHub | null> {
  const qs = new URLSearchParams({ month: String(month), year: String(year) })
  if (date) qs.set("date", date)

  const res = await fetch(`/api/dashboard/alert-hub?${qs}`, { cache: "no-store" })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

export function useDashboardAlertHub(
  month: number,
  year: number,
  date?: string
) {
  return useQuery<DashboardAlertHub | null>({
    queryKey: ["dashboard", "alert-hub", year, month, date],
    queryFn: () => fetchDashboardAlertHub(month, year, date),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })
}
