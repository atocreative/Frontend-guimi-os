"use client"

import { useQuery } from "@tanstack/react-query"
import type { KPIs } from "@/lib/services/comercial-bi"

const STALE = 3 * 60 * 1_000   // 3min — KPIs comerciais não mudam por minuto
const GC    = 10 * 60 * 1_000  // 10min em cache
const POLL  = 5 * 60 * 1_000   // refetch silencioso a cada 5min

async function fetchComercialKPIs(): Promise<KPIs | null> {
  const res = await fetch("/api/comercial/bi", { cache: "no-store" })
  if (!res.ok) return null
  const j = await res.json().catch(() => null)
  return j?.kpis ?? null
}

/**
 * KPIs comerciais leves para o Dashboard.
 * Consome o mesmo endpoint que BIDashboard (/api/comercial/bi)
 * mas expõe apenas os KPIs — sem pipeline, leads prioritários ou fontes.
 */
export function useDashboardComercialKPIs() {
  return useQuery<KPIs | null>({
    queryKey: ["dashboard", "comercial-kpis"] as const,
    queryFn: fetchComercialKPIs,
    staleTime: STALE,
    gcTime: GC,
    refetchInterval: POLL,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev ?? null,
  })
}
