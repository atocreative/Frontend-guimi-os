import { useState, useCallback } from "react"
import { syncFoneNinja } from "@/lib/services/integrations-service"

export type SyncState = "idle" | "syncing" | "success" | "error"

export interface SyncLog {
  id: string
  timestamp: Date
  status: "success" | "error"
  message: string
  duration?: number
}

interface UseSyncStatusReturn {
  state: SyncState
  isLoading: boolean
  logs: SyncLog[]
  lastSyncTime?: Date
  sync: () => Promise<void>
  addLog: (log: SyncLog) => void
}

export function useSyncStatus(): UseSyncStatusReturn {
  const [state, setState] = useState<SyncState>("idle")
  const [logs, setLogs] = useState<SyncLog[]>([
    {
      id: "3",
      timestamp: new Date(Date.now() - 3600000),
      status: "success",
      message: "Sincronização automática concluída",
      duration: 2400,
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 7200000),
      status: "success",
      message: "Sincronização automática concluída",
      duration: 2100,
    },
    {
      id: "1",
      timestamp: new Date(Date.now() - 10800000),
      status: "success",
      message: "Sincronização automática concluída",
      duration: 1950,
    },
  ])

  const lastSyncTime = logs.length > 0 ? logs[0]?.timestamp : undefined
  const isLoading = state === "syncing"

  const sync = useCallback(async () => {
    setState("syncing")
    const startTime = Date.now()

    try {
      const result = await syncFoneNinja()
      const duration = Date.now() - startTime

      if (result.success) {
        const newLog: SyncLog = {
          id: Date.now().toString(),
          timestamp: new Date(),
          status: "success",
          message: `Sincronização concluída: ${result.data?.recordsProcessed || 0} registros`,
          duration,
        }
        setLogs((prev) => [newLog, ...prev])
        setState("success")
        setTimeout(() => setState("idle"), 3000)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      const newLog: SyncLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        status: "error",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        duration: Date.now() - startTime,
      }
      setLogs((prev) => [newLog, ...prev])
      setState("error")
      setTimeout(() => setState("idle"), 5000)
    }
  }, [])

  const addLog = useCallback((log: SyncLog) => {
    setLogs((prev) => [log, ...prev])
  }, [])

  return {
    state,
    isLoading,
    logs,
    lastSyncTime,
    sync,
    addLog,
  }
}
