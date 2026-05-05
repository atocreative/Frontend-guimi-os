import type { DashboardSummary } from "@/lib/types/dashboard"

export async function getDashboardSummary(params: {
  startDate: string
  endDate: string
}): Promise<DashboardSummary | null> {
  try {
    const qs = new URLSearchParams(params).toString()
    const res = await fetch(`/api/dashboard/summary?${qs}`, { cache: "no-store" })

    if (!res.ok) {
      console.warn("[FRONT DASHBOARD] Resposta não OK:", res.status)
      return null
    }

    const data = await res.json().catch(() => null)

    if (
      data == null ||
      (data.financeiro == null && data.faturamentoMes == null && data.grafico == null)
    ) {
      console.warn("[FRONT DASHBOARD] Resposta sem campos esperados", data)
      return null
    }

    return data as DashboardSummary
  } catch (error) {
    console.warn("[FRONT DASHBOARD] Falha ao buscar summary", error)
    return null
  }
}
