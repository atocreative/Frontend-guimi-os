"use client"

import { useQuery } from "@tanstack/react-query"
import type { FinanceiroHealthPayload } from "@/app/api/financeiro/health/route"

export type { FinanceiroHealthPayload }

async function fetchHealth(): Promise<FinanceiroHealthPayload> {
  const res = await fetch("/api/financeiro/health", { cache: "no-store" })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useFinanceiroHealth() {
  return useQuery<FinanceiroHealthPayload>({
    queryKey: ["financeiro", "health"],
    queryFn: fetchHealth,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
  })
}
