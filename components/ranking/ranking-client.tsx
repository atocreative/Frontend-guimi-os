"use client"

import { useCallback, useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { RankingPodio } from "./ranking-podio"
import { RankingTable } from "./ranking-table"
import { RankingFiltersBar } from "./ranking-filters"
import type { RankingEntry, RankingFilters } from "./types"

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

function periodLabel(filters: RankingFilters) {
  if (filters.period === "hoje") return "Hoje"
  if (filters.period === "semana") return "Esta semana"
  if (filters.period === "ano") return `Ano ${filters.year}`
  return `${MESES[filters.month - 1]} ${filters.year}`
}

export function RankingClient() {
  const now = new Date()
  const [filters, setFilters] = useState<RankingFilters>({
    period: "mes",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    seller: "",
  })
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRanking = useCallback(async (f: RankingFilters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period: f.period,
        month: String(f.month),
        year: String(f.year),
      })
      if (f.seller) params.set("seller", f.seller)

      const res = await fetch(`/api/ranking?${params}`, { cache: "no-store" })
      if (!res.ok) { setEntries([]); return }
      const data = await res.json()
      setEntries(Array.isArray(data?.data) ? data.data : [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRanking(filters)
  }, [filters, fetchRanking])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Ranking</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Carregando..." : `${entries.length} vendedor(es) · ${periodLabel(filters)}`}
          </p>
        </div>
        <RankingFiltersBar filters={filters} onChange={setFilters} />
      </div>

      {/* Podium */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="order-2 h-72 rounded-2xl md:order-2" />
          <Skeleton className="order-1 h-60 rounded-2xl md:order-1 md:mt-8" />
          <Skeleton className="order-3 h-52 rounded-2xl md:mt-14" />
        </div>
      ) : (
        <RankingPodio entries={entries} />
      )}

      {/* Full table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Ranking completo
        </h3>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <RankingTable entries={entries} />
        )}
      </div>
    </div>
  )
}
