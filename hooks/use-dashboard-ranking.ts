"use client"

import { useEffect, useRef, useState } from "react"
import type { PerformanceEntry } from "@/components/ranking/types"

interface UseDashboardRankingOptions {
  mes: number  // 0-indexed
  ano: number
  pollMs?: number
}

export function useDashboardRanking({ mes, ano, pollMs = 300_000 }: UseDashboardRankingOptions) {
  const [entries, setEntries] = useState<PerformanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetch_ = async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        abortRef.current?.abort()
        const ctrl = new AbortController()
        abortRef.current = ctrl

        const params = new URLSearchParams({
          period: "mes",
          month: String(mes + 1), // API expects 1-indexed
          year: String(ano),
        })
        const res = await fetch(`/api/ranking?${params}`, {
          cache: "no-store",
          signal: ctrl.signal,
        })
        if (!res.ok) { if (!silent && !cancelled) setEntries([]); return }
        const data = await res.json()
        if (!cancelled) setEntries(Array.isArray(data?.data) ? data.data : [])
      } catch {
        if (!silent && !cancelled) setEntries([])
      } finally {
        if (!silent && !cancelled) setLoading(false)
      }
    }

    fetch_()

    const interval = setInterval(() => {
      if (!document.hidden) fetch_(true)
    }, pollMs)

    return () => {
      cancelled = true
      abortRef.current?.abort()
      clearInterval(interval)
    }
  }, [mes, ano, pollMs])

  return { entries, loading }
}
