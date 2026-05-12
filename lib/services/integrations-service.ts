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

    const res = await fetch(`${BACKEND_URL}/integrations/foneninja/sync`, {
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

export async function getIntegrationStatus() {
  try {
    const res = await fetch(`${BACKEND_URL}/integrations/status`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
