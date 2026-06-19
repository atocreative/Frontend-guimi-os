"use client"

import { useQuery } from "@tanstack/react-query"
import type { OperationDashboardPayload } from "@/app/api/operation/dashboard/route"

export type { OperationDashboardPayload }

async function fetchOperationDashboard(
  month: number,
  year: number,
  topFilter = ""
): Promise<OperationDashboardPayload | null> {
  const qs = new URLSearchParams({ month: String(month), year: String(year), topLimit: "10" })
  if (topFilter) qs.set("topFilter", topFilter)
  const res = await fetch(`/api/operation/dashboard?${qs}`, { cache: "no-store" })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

export function useOperationDashboard(month: number, year: number, topFilter = "") {
  return useQuery<OperationDashboardPayload | null>({
    queryKey: ["operation", "dashboard", year, month, topFilter],
    queryFn:  () => fetchOperationDashboard(month, year, topFilter),
    staleTime: 60_000,
    gcTime:    5 * 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })
}
