"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { RankingPodio } from "./ranking-podio"
import { RankingTable } from "./ranking-table"
import { RankingFiltersBar } from "./ranking-filters"
import { PerformanceCard } from "./performance-card"
import type { PerformanceEntry, RankingFilters } from "./types"

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

function periodLabel(f: RankingFilters) {
  if (f.period === "hoje") return "Hoje"
  if (f.period === "semana") return "Esta semana"
  if (f.period === "ano") return `Ano ${f.year}`
  return `${MESES[f.month - 1]} ${f.year}`
}

export function RankingClient() {
  const now = new Date()
  const [filters, setFilters] = useState<RankingFilters>({
    period: "mes",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  })
  const [entries, setEntries] = useState<PerformanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const filtersRef = useRef(filters)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  filtersRef.current = filters

  const fetchRanking = useCallback(async (f: RankingFilters, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams({
        period: f.period,
        month: String(f.month),
        year: String(f.year),
      })
      const res = await fetch(`/api/ranking?${params}`, { cache: "no-store" })
      if (!res.ok) { if (!silent) setEntries([]); return }
      const data = await res.json()
      setEntries(Array.isArray(data?.data) ? data.data : [])
    } catch {
      if (!silent) setEntries([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRanking(filters)
  }, [filters, fetchRanking])

  // Silent background polling every 30s, pauses when tab hidden
  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === "visible") {
        fetchRanking(filtersRef.current, true)
      }
    }
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchRanking(filtersRef.current, true)
        timerRef.current = setInterval(poll, 30_000)
      } else {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      }
    }
    timerRef.current = setInterval(poll, 30_000)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [fetchRanking])

  const topScore = entries[0]?.score ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Ranking Operacional</h2>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Carregando..."
              : `${entries.length} colaborador(es) · ${periodLabel(filters)}${topScore > 0 ? ` · líder com ${topScore.toLocaleString("pt-BR")} pts` : ""}`}
          </p>
        </div>
        <RankingFiltersBar filters={filters} onChange={setFilters} />
      </div>

      {/* Podium */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="md:mt-8 h-64 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="md:mt-14 h-56 rounded-2xl" />
        </div>
      ) : (
        <RankingPodio entries={entries} />
      )}

      {/* Full table */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

      {/* Performance individual */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Performance individual
        </h3>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : entries.length === 0 ? null : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <PerformanceCard key={entry.userId} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
