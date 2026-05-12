import { useState, useEffect, useCallback } from "react"
import { getIntegrationStatus } from "@/lib/services/integrations-service"

export interface IntegrationStatusData {
  status:
    | "sincronizando_historico"
    | "processando"
    | "concluido"
    | "erro"
    | "aguardando"
  lastSync?: Date
  recordsProcessed?: number
  registrosTotal?: number
  nextSyncIn?: number // milliseconds
  backendStatus?: "online" | "offline"
  dbStatus?: "online" | "offline"
  foneninjaStatus?: "online" | "offline"
  source?: "PostgreSQL" | "FoneNinja" | string
  cronStatus?: "ativo" | "parado" | "atrasado" | string
}

function normalizeStatus(status?: string): IntegrationStatusData["status"] {
  if (status === "sincronizando" || status === "sincronizando_historico") return "sincronizando_historico"
  if (status === "processando") return "processando"
  if (status === "atualizado" || status === "concluido") return "concluido"
  if (status === "erro") return "erro"
  return "aguardando"
}

export function useIntegrationStatus(pollIntervalMs: number = 5 * 60 * 1000) {
  const [status, setStatus] = useState<IntegrationStatusData>({
    status: "aguardando",
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getIntegrationStatus()
      if (data) {
        const cronStatus = data._meta?.cronStatus ?? (data.nextSyncIn === undefined ? undefined : data.nextSyncIn < 0 ? "atrasado" : "ativo")
        setStatus({
          status: normalizeStatus(data.status),
          lastSync: data.lastSync ? new Date(data.lastSync) : undefined,
          recordsProcessed: data.recordsProcessed,
          registrosTotal: data.registrosTotal,
          nextSyncIn: data.nextSyncIn,
          backendStatus: data.backendStatus,
          dbStatus: data.dbStatus,
          foneninjaStatus: data.foneninjaStatus,
          source: data._meta?.source,
          cronStatus,
        })
      }
    } catch (error) {
      console.error("Erro ao buscar status de integrações:", error)
      setStatus((prev) => ({ ...prev, status: "erro" }))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // First load
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Polling a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(fetchStatus, pollIntervalMs)
    return () => clearInterval(interval)
  }, [fetchStatus, pollIntervalMs])

  return {
    status,
    isLoading,
    refetch: fetchStatus,
  }
}
