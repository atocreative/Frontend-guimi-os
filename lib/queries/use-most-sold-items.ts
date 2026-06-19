"use client"

import { useQuery } from "@tanstack/react-query"
import type { MostSoldItem } from "@/app/api/dashboard/most-sold-items/route"

export type { MostSoldItem }

async function fetchMostSold(): Promise<{ data: MostSoldItem[] | null }> {
  const res = await fetch("/api/dashboard/most-sold-items", { cache: "no-store" })
  if (!res.ok) return { data: null }
  return res.json().catch(() => ({ data: null }))
}

export function useMostSoldItems() {
  return useQuery<{ data: MostSoldItem[] | null }>({
    queryKey: ["operacao", "most-sold-items"],
    queryFn: fetchMostSold,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })
}


async function fetchMostSoldByType(tipo: string): Promise<{ data: MostSoldItem[] | null }> {
  const res = await fetch(`/api/dashboard/most-sold-items?tipo=${encodeURIComponent(tipo)}`, { cache: "no-store" })
  if (!res.ok) return { data: null }
  return res.json().catch(() => ({ data: null }))
}

export function useMostSoldItemsByType(tipo: string) {
  return useQuery<{ data: MostSoldItem[] | null }>({
    queryKey: ["operacao", "most-sold-items", tipo],
    queryFn: () => fetchMostSoldByType(tipo),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })
}
