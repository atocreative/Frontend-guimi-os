import { useState, useCallback } from "react"

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
      // Simular chamada para API de sync
      // Em produção: await fetch("/api/sync", { method: "POST" })
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000))

      const newLog: SyncLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        status: "success",
        message: "Sincronização manual concluída",
        duration: Date.now() - startTime,
      }

      setLogs((prev) => [newLog, ...prev])
      setState("success")

      // Reset ao sucesso após 3s
      setTimeout(() => setState("idle"), 3000)
    } catch (error) {
      const newLog: SyncLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        status: "error",
        message: "Falha na sincronização",
        duration: Date.now() - startTime,
      }

      setLogs((prev) => [newLog, ...prev])
      setState("error")

      // Reset ao erro após 5s
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
