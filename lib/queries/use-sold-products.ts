import { useQuery } from "@tanstack/react-query"

async function fetchSoldProducts(year: number, month1: number): Promise<number> {
  const res = await fetch(`/api/dashboard/sold-products?year=${year}&month=${month1}`, { cache: "no-store" })
  if (!res.ok) return 0
  const data = await res.json().catch(() => null)
  return Number(data?.total ?? 0)
}

export function useSoldProducts(year: number, month1: number) {
  return useQuery<number>({
    queryKey: ["dashboard", "sold-products", year, month1],
    queryFn: () => fetchSoldProducts(year, month1),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })
}
