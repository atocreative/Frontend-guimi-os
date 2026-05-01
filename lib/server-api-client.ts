/**
 * Server-side API client for Next.js App Router
 * Uses NextAuth session to get accessToken and makes authenticated requests
 *
 * ⚠️ IMPORTANT: This is for SERVER-SIDE ONLY (page.tsx, repositories, server actions)
 * For client components, use lib/api-client.ts instead
 */

import { auth } from "@/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"

export class ServerApiError extends Error {
  constructor(
    public status: number,
    public data?: unknown,
    message?: string,
    public code?: string
  ) {
    super(message || `Server API Error ${status}`)
    this.name = "ServerApiError"
  }
}

async function parseResponse(res: Response) {
  const text = await res.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getApiErrorMessage(status: number, data: unknown) {
  if (data && typeof data === "object") {
    const payload = data as { message?: string; error?: string }
    return payload.message || payload.error || `Server API Error ${status}`
  }

  return `Server API Error ${status}`
}

export async function serverApiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const session = await auth()
  const token = session?.accessToken

  if (!token) {
    throw new ServerApiError(
      401,
      { code: "SESSION_INVALID_SERVER" },
      "Sessão inválida no servidor",
      "SESSION_INVALID_SERVER"
    )
  }

  const url = `${API_BASE}${path}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options?.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      throw new ServerApiError(
        response.status,
        data,
        getApiErrorMessage(response.status, data),
        data && typeof data === "object" ? (data as { code?: string }).code : undefined
      )
    }

    return data as T
  } catch (error) {
    if (error instanceof ServerApiError) {
      throw error
    }

    throw new ServerApiError(
      503,
      undefined,
      "Não foi possível comunicar com a API do servidor",
      "SERVER_API_FETCH_ERROR"
    )
  }
}

export const serverApi = {
  async getUsers() {
    const data = await serverApiFetch("/api/users")
    return data
  },

  async getFinanceiroSnapshot(month: number, year: number) {
    const data = await serverApiFetch(`/api/financeiro/snapshot?month=${month}&year=${year}`)
    return data
  },

  async getFinanceiroReceitas(month: number, year: number) {
    const data = await serverApiFetch(`/api/financeiro/receitas?month=${month}&year=${year}`)
    return data
  },

  async getDashboard() {
    const data = await serverApiFetch("/api/dashboard")
    return data
  },

  async syncFoneNinja() {
    const data = await serverApiFetch("/api/financeiro/sync/feneninja", {
      method: "POST",
    })
    return data
  },
}
