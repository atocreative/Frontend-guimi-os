"use client"

import { useQuery } from "@tanstack/react-query"

export interface AppleTrendLeader {
  productName: string
  quantidadeVendida: number
  receitaTotal?: number
}

export interface AppleTrendPayload {
  /** "iPhone" | "iPad" | "Apple Watch" etc. — categoria analisada */
  categoria: string
  monthLabel: string       // ex: "Junho"
  prevMonthLabel: string   // ex: "Maio"
  current: AppleTrendLeader | null
  previous: AppleTrendLeader | null
  growthPct: number | null // delta % entre current.quantidadeVendida e previous.quantidadeVendida
  generatedAt?: string | null
}

const EMPTY: AppleTrendPayload = {
  categoria: "iPhone",
  monthLabel: "",
  prevMonthLabel: "",
  current: null,
  previous: null,
  growthPct: null,
  generatedAt: null,
}

const STALE = 5 * 60 * 1_000      // 5 min — tendência muda lentamente
const GC    = 30 * 60 * 1_000

async function fetchAppleTrend(): Promise<AppleTrendPayload> {
  const res = await fetch("/api/operacao/apple-trend", { cache: "no-store" })
  if (!res.ok) return EMPTY
  const j = (await res.json().catch(() => null)) as Partial<AppleTrendPayload> | null
  if (!j) return EMPTY
  return {
    categoria:       j.categoria       ?? EMPTY.categoria,
    monthLabel:      j.monthLabel      ?? EMPTY.monthLabel,
    prevMonthLabel:  j.prevMonthLabel  ?? EMPTY.prevMonthLabel,
    current:         j.current         ?? null,
    previous:        j.previous        ?? null,
    growthPct:       j.growthPct       ?? null,
    generatedAt:     j.generatedAt     ?? null,
  }
}

/** Tendência de Mercado Apple — líder iPhone do mês vs mês anterior. */
export function useAppleTrend() {
  return useQuery<AppleTrendPayload>({
    queryKey: ["operacao", "apple-trend"] as const,
    queryFn: fetchAppleTrend,
    staleTime: STALE,
    gcTime: GC,
    refetchInterval: false,
    placeholderData: (prev) => prev ?? EMPTY,
  })
}
