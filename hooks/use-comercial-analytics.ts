"use client"

import useSWR from "swr"
import type { ComercialAnalytics } from "@/lib/services/comercial-analytics"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useComercialAnalytics() {
  const { data, isLoading, error, mutate } = useSWR<ComercialAnalytics>(
    "/api/comercial/analytics/full",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      errorRetryCount: 2,
    }
  )

  return {
    analytics: data ?? null,
    isLoading,
    hasError: !!error,
    refresh: mutate,
  }
}
