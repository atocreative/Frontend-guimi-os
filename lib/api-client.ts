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

function clearAuthTokenCache() {
  cachedToken = null
  tokenExpiry = 0
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

async function getAuthToken(): Promise<string> {
  if (typeof window === "undefined") {
    throw new ApiError(
      401,
      { code: "FRONTEND_SESSION_MISSING" },
      "Sessão indisponível fora do navegador.",
      "FRONTEND_SESSION_MISSING"
    )
  }

  const now = Date.now()
  if (cachedToken && now < tokenExpiry) {
    return cachedToken
  }

  let data: unknown = null

  try {
    const res = await fetch(TOKEN_ENDPOINT, { cache: "no-store" })
    data = await parseResponse(res)

    if (res.status === 401) {
      clearAuthTokenCache()
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

    cachedToken = tokenPayload.token
    tokenExpiry = now + 50 * 60 * 1000
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
  const token = auth === "required" ? await getAuthToken() : undefined

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
    if (response.status === 401 && auth === "required") {
      clearAuthTokenCache()
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
    return apiCall("/dashboard")
  },

  async getHealth() {
    return apiCall("/health", { auth: "none" })
  },
}
