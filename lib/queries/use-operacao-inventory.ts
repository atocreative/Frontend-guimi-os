"use client"

import { useQuery } from "@tanstack/react-query"
import type { InventoryPayload } from "@/app/api/dashboard/inventory/route"

async function fetchInventory(): Promise<InventoryPayload | null> {
  const res = await fetch("/api/dashboard/inventory", { cache: "no-store" })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

export function useOperacaoInventory() {
  return useQuery<InventoryPayload | null>({
    queryKey: ["operacao", "inventory"],
    queryFn: fetchInventory,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })
}
