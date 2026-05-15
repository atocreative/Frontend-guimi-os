import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"

export interface SyncResponse {
  success: boolean
  message: string
  data?: {
    recordsProcessed: number
    recordsCreated: number
    recordsUpdated: number
    duration: number
    timestamp: string
  }
}

export async function syncFoneNinja(): Promise<SyncResponse> {
  try {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("__session_token")
      : null

    const res = await fetch(`${BACKEND_URL}/api/integrations/foneninja/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!res.ok) {
      return {
        success: false,
        message: `Erro ${res.status}: ${res.statusText}`,
      }
    }

    const data = await res.json()
    return {
      success: true,
      message: "Sincronização concluída",
      data: data?.data,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

export interface IntegrationStatusResponse {
  status:
    | "sincronizando"
    | "sincronizando_historico"
    | "processando"
    | "concluido"
    | "atualizado"
    | "erro"
    | "aguardando"
  lastSync?: string // ISO timestamp
  recordsProcessed?: number
  registrosTotal?: number
  nextSyncIn?: number // milliseconds
  backendStatus?: "online" | "offline"
  dbStatus?: "online" | "offline"
  foneninjaStatus?: "online" | "offline"
  message?: string
  _meta?: {
    source?: "PostgreSQL" | "FoneNinja" | string
    cronStatus?: "ativo" | "parado" | "atrasado" | string
  }
}

export async function getIntegrationStatus(): Promise<IntegrationStatusResponse | null> {
  try {
    // Call the frontend proxy (handles auth via NextAuth session cookie)
    const res = await fetch("/api/integrations/status", { cache: "no-store" })
    if (!res.ok) return null

    const raw = await res.json()

    // Backend returns { foneninja: "online"|"offline", kommo: ..., meuAssessor: ... }
    // Normalize to IntegrationStatusResponse
    const foneninjaStatus: "online" | "offline" =
      raw.foneninja === "online" ? "online" : "offline"

    return {
      status: foneninjaStatus === "online" ? "concluido" : "aguardando",
      foneninjaStatus,
      backendStatus: "online",
      dbStatus: "online",
      _meta: { source: "PostgreSQL", cronStatus: "ativo" },
      ...raw,
    }
  } catch {
    return null
  }
}
