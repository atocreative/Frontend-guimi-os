"use client"

import { useQuery } from "@tanstack/react-query"
import type { SystemAuditPayload } from "@/app/api/system/audit/full/route"

export type { SystemAuditPayload }

async function fetchAudit(month: number, year: number): Promise<SystemAuditPayload> {
  const res = await fetch(`/api/system/audit/full?month=${month}&year=${year}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useSystemAudit(month: number, year: number) {
  return useQuery<SystemAuditPayload>({
    queryKey: ["system", "audit", year, month],
    queryFn:  () => fetchAudit(month, year),
    staleTime: 30_000,
    gcTime:    5 * 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: 1,
  })
}
