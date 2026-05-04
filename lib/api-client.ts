import {
  backendFetch,
  backendLogin,
  backendVerifyMfa,
  extractChecklistItemPayload,
  extractChecklistsPayload,
  extractTaskPayload,
  extractTasksPayload,
  extractUserPayload,
  extractUsersPayload,
} from "@/lib/backend-api"

const TOKEN_ENDPOINT = "/api/auth/token"

type AuthMode = "required" | "none"

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>
  auth?: AuthMode
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message?: string,
    public code?: string
  ) {
    super(message || `API Error ${status}`)
  }
}

let cachedToken: string | null = null
let tokenExpiry = 0
let tokenExpirationHandler: (() => void) | null = null

function clearAuthTokenCache() {
  cachedToken = null
  tokenExpiry = 0
}

export function setTokenExpirationHandler(handler: () => void) {
  tokenExpirationHandler = handler
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
    return payload.message || payload.error || `API Error ${status}`
  }

  return `API Error ${status}`
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    throw new ApiError(
      401,
      { code: "FRONTEND_SESSION_MISSING" },
      "Sessão indisponível fora do navegador.",
      "FRONTEND_SESSION_MISSING"
    )
  }

  const now = Date.now()

  // Validar token em cache
  if (cachedToken && now < tokenExpiry) {
    const cachedTokenStr = String(cachedToken).trim()
    if (cachedTokenStr.length > 0) {
      const parts = cachedTokenStr.split('.')
      if (parts.length === 3) {
        console.log("[getAuthToken] Token em cache válido e em uso")
        return cachedToken
      }
    }
    // Token em cache inválido, limpar
    console.warn("[getAuthToken] Token em cache inválido, limpando cache")
    clearAuthTokenCache()
  }

  let data: unknown = null

  try {
    const res = await fetch(TOKEN_ENDPOINT, { cache: "no-store" })
    data = await parseResponse(res)

    if (res.status === 401) {
      clearAuthTokenCache()
      // Trigger token expiration modal instead of throwing error
      if (tokenExpirationHandler) {
        tokenExpirationHandler()
        // Return null to prevent further processing
        return null
      }
      throw new ApiError(
        401,
        data ?? { code: "FRONTEND_SESSION_MISSING" },
        "Sessão expirada. Faça login novamente.",
        "FRONTEND_SESSION_MISSING"
      )
    }

    if (!res.ok) {
      clearAuthTokenCache()
      throw new ApiError(
        res.status,
        data,
        getApiErrorMessage(res.status, data),
        "TOKEN_ENDPOINT_ERROR"
      )
    }

    const tokenPayload = data && typeof data === "object" ? data as { token?: string } : null

    if (!tokenPayload?.token) {
      clearAuthTokenCache()
      throw new ApiError(
        500,
        data,
        "O frontend não retornou um token de autenticação válido.",
        "TOKEN_ENDPOINT_ERROR"
      )
    }

    // Validar novo token antes de cachear
    const newTokenStr = String(tokenPayload.token).trim()
    if (newTokenStr.length === 0) {
      clearAuthTokenCache()
      throw new ApiError(
        500,
        data,
        "Token retornado é vazio.",
        "TOKEN_ENDPOINT_ERROR"
      )
    }

    const tokenParts = newTokenStr.split('.')
    if (tokenParts.length !== 3) {
      clearAuthTokenCache()
      throw new ApiError(
        500,
        data,
        "Formato de token inválido (esperado JWT com 3 partes).",
        "TOKEN_ENDPOINT_ERROR"
      )
    }

    cachedToken = newTokenStr
    tokenExpiry = now + 50 * 60 * 1000
    console.log("[getAuthToken] Novo token obtido e validado com sucesso", {
      tokenLength: newTokenStr.length,
      expiryIn: "50 minutos",
    })
    return cachedToken
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    clearAuthTokenCache()
    throw new ApiError(
      503,
      data,
      "Não foi possível obter o token de autenticação.",
      "TOKEN_ENDPOINT_ERROR"
    )
  }
}

async function executeRequest(
  path: string,
  fetchOptions: RequestInit,
  auth: AuthMode,
  retryUnauthorized: boolean,
  params?: Record<string, string | number | boolean | null | undefined>
) {
  const tokenOrNull = auth === "required" ? await getAuthToken() : undefined
  const token = tokenOrNull || undefined

  console.log({
    path,
    hasToken: !!token,
  })

  const { response, data } = await backendFetch(path, {
    ...fetchOptions,
    params,
    token,
  })

  if (response.status === 401 && auth === "required" && retryUnauthorized) {
    clearAuthTokenCache()
    await getAuthToken()
    return executeRequest(path, fetchOptions, auth, false, params)
  }

  if (!response.ok) {
    if (response.status === 400) {
      console.error("[api-client] 400 response", {
        path,
        payload: fetchOptions.body,
        response: data,
      })
    }

    if (response.status === 401 && auth === "required") {
      console.warn("[api-client] 401 response", {
        path,
        hasToken: !!token,
        tokenPreview: token ? `${token.slice(0, 20)}...` : null,
        response: data,
      })
      clearAuthTokenCache()
      // Trigger token expiration modal instead of throwing error
      if (tokenExpirationHandler) {
        tokenExpirationHandler()
        // Return null to prevent further processing
        return null
      }
      throw new ApiError(
        401,
        data,
        getApiErrorMessage(response.status, data),
        "BACKEND_TOKEN_REJECTED"
      )
    }

    const payload = data && typeof data === "object" ? data as { code?: string } : null
    throw new ApiError(response.status, data, getApiErrorMessage(response.status, data), payload?.code)
  }

  return data
}

async function apiCall(path: string, options: FetchOptions = {}) {
  const { params, auth = "required", ...fetchOptions } = options
  return executeRequest(path, fetchOptions, auth, auth === "required", params)
}

export const api = {
  clearAuthTokenCache,

  async login(payload: { email: string; password: string; captchaToken?: string; captchaAnswer?: string }) {
    const { response, data } = await backendLogin(payload)

    if (!response.ok) {
      const payloadData = data && typeof data === "object" ? data as { code?: string } : null
      throw new ApiError(response.status, data, getApiErrorMessage(response.status, data), payloadData?.code)
    }

    // Backend retorna { data: { accessToken, user, ... } }
    // Extrair .data se existir
    if (data && typeof data === 'object' && 'data' in data) {
      return (data as { data: any }).data
    }

    return data
  },

  async verifyMfa(payload: { challengeToken: string; code: string }) {
    const { response, data } = await backendVerifyMfa(payload)

    if (!response.ok) {
      const payloadData = data && typeof data === "object" ? data as { code?: string } : null
      throw new ApiError(response.status, data, getApiErrorMessage(response.status, data), payloadData?.code)
    }

    return data
  },

  async getTasks(filters?: { assigneeId?: string; status?: string; orderBy?: string; sort?: string; limit?: number }) {
    const data = await apiCall("/api/tasks", { params: filters })
    return extractTasksPayload(data)
  },

  async getTaskById(id: string) {
    const data = await apiCall(`/api/tasks/${id}`)
    return extractTaskPayload(data)
  },

  async createTask(payload: {
    title: string
    description?: string | null
    priority?: string | null
    dueAt?: string | null
    horario?: string | null
    assigneeId?: string | null
  }) {
    const data = await apiCall("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return extractTaskPayload(data)
  },

  async updateTask(
    id: string,
    payload: Partial<{
      title: string
      description: string | null
      status: string
      priority: string | null
      dueAt: string | null
      horario: string | null
      assigneeId: string | null
    }>
  ) {
    const data = await apiCall(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return extractTaskPayload(data)
  },

  async deleteTask(id: string) {
    await apiCall(`/api/tasks/${id}`, { method: "DELETE" })
    return null
  },

  async getUsers(filters?: { active?: boolean; orderBy?: string }) {
    const data = await apiCall("/api/users", { params: filters })
    return extractUsersPayload(data)
  },

  async createUser(payload: {
    name: string
    email: string
    password: string
    jobTitle: string
    role: "COLABORADOR" | "GESTOR"
  }) {
    const data = await apiCall("/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return extractUserPayload(data)
  },

  async updateUser(
    id: string,
    payload: Partial<{
      name: string
      email: string
      jobTitle: string
      role: string
      active: boolean
    }>
  ) {
    const data = await apiCall(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return extractUserPayload(data)
  },

  async deleteUser(id: string) {
    await apiCall(`/api/users/${id}`, { method: "DELETE" })
    return null
  },

  async getChecklists(tipo?: "ABERTURA" | "FECHAMENTO") {
    const data = await apiCall("/api/checklists", { params: tipo ? { tipo } : undefined })
    return { checklists: extractChecklistsPayload(data) }
  },

  async getChecklistById(id: string) {
    const data = await apiCall(`/api/checklists/${id}`)
    return extractChecklistItemPayload(data)
  },

  async createChecklist(payload: { title: string; description?: string | null; tipo: "ABERTURA" | "FECHAMENTO" }) {
    return apiCall("/api/checklists", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateChecklist(id: string, payload: { completed: boolean }) {
    const data = await apiCall(`/api/checklists/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return extractChecklistItemPayload(data)
  },

  async getDashboard() {
    return apiCall("/api/dashboard")
  },

  async syncFoneNinja() {
    const data = await apiCall("/api/financeiro/sync/feneninja", {
      method: "POST",
    })
    return data
  },

  async getFinanceiroSnapshot(month: number, year: number) {
    const data = await apiCall("/api/financeiro/snapshot", {
      params: { month: month.toString(), year: year.toString() },
    })
    return data
  },

  async getFinanceiroReceitas(month: number, year: number) {
    const data = await apiCall("/api/financeiro/receitas", {
      params: { month: month.toString(), year: year.toString() },
    })
    return data
  },

  async updateDevMenu(featureId: string, payload: { enabled?: boolean; pending?: boolean; allowedRoles?: string[] }) {
    // Use Next.js BFF route — avoids CORS and handles auth server-side
    const res = await fetch(`/api/dev-menu/${featureId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`dev-menu PUT failed: ${res.status}`)
    return res.json().catch(() => ({ ok: true }))
  },

  async getGamificationLeaderboard(scope: string) {
    return apiCall(`/api/gamificacao/leaderboard?scope=${scope}`)
  },

  async getGamificationUserStats(userId: string) {
    return apiCall(`/api/gamificacao/usuarios/${userId}`)
  },

  async getHealth() {
    return apiCall("/health", { auth: "none" })
  },

  async getMenuConfig() {
    return apiCall("/api/menu-config")
  },

  async updateMenuConfig(items: any[]) {
    return apiCall("/api/menu-config", {
      method: "PUT",
      body: JSON.stringify({ items }),
    })
  },

  async updateCurrentUserPassword(payload: { newPassword: string }) {
    const data = await apiCall("/api/users/me/password", {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return data
  },
}
