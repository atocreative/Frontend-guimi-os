const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"

type AuthMode = "required" | "none"

interface FetchOptions extends RequestInit {
  params?: Record<string, any>
  auth?: AuthMode
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: any,
    message?: string,
    public code?: string
  ) {
    super(message || `API Error ${status}`)
  }
}

let _cachedToken: string | null = null
let _tokenExpiry = 0

function clearAuthTokenCache() {
  _cachedToken = null
  _tokenExpiry = 0
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

function getApiErrorMessage(status: number, data: any) {
  if (data && typeof data === "object") {
    return data.message || data.error || `API Error ${status}`
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
  if (_cachedToken && now < _tokenExpiry) {
    return _cachedToken
  }

  let data: any = null

  try {
    const res = await fetch("/api/auth/token", { cache: "no-store" })
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

    if (!data?.token) {
      clearAuthTokenCache()
      throw new ApiError(
        500,
        data,
        "O frontend não retornou um token de autenticação válido.",
        "TOKEN_ENDPOINT_ERROR"
      )
    }

    _cachedToken = data.token
    _tokenExpiry = now + 50 * 60 * 1000
    return _cachedToken
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
  url: string,
  fetchOptions: RequestInit,
  auth: AuthMode,
  retryUnauthorized: boolean
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (auth === "required") {
    const token = await getAuthToken()
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  const data = await parseResponse(res)

  if (res.status === 401 && auth === "required" && retryUnauthorized) {
    clearAuthTokenCache()
    await getAuthToken()
    return executeRequest(url, fetchOptions, auth, false)
  }

  if (!res.ok) {
    if (res.status === 401 && auth === "required") {
      clearAuthTokenCache()
      throw new ApiError(
        401,
        data,
        getApiErrorMessage(res.status, data),
        "BACKEND_TOKEN_REJECTED"
      )
    }

    throw new ApiError(res.status, data, getApiErrorMessage(res.status, data))
  }

  return data
}

async function apiCall(path: string, options: FetchOptions = {}) {
  const { params, auth = "required", ...fetchOptions } = options

  let url = `${API_BASE}${path}`

  if (params) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value))
      }
    })
    if (query.toString()) {
      url += `?${query.toString()}`
    }
  }

  return executeRequest(url, fetchOptions, auth, auth === "required")
}

export const api = {
  async getTasks(filters?: { assigneeId?: string; status?: string }) {
    return apiCall("/api/tasks", { params: filters })
  },

  async createTask(payload: {
    title: string
    description?: string | null
    priority?: string | null
    dueAt?: string | null
    horario?: string | null
    assigneeId?: string | null
  }) {
    return apiCall("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    })
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
    return apiCall(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async deleteTask(id: string) {
    return apiCall(`/api/tasks/${id}`, { method: "DELETE" })
  },

  async getUsers(filters?: { active?: boolean }) {
    const data = await apiCall("/api/users", { params: filters })
    const users = Array.isArray(data?.users)
      ? data.users
      : Array.isArray(data?.usuarios)
        ? data.usuarios
        : []

    return {
      ...(data && typeof data === "object" ? data : {}),
      users,
    }
  },

  async createUser(payload: {
    name: string
    email: string
    password: string
    jobTitle: string
    role: "COLABORADOR" | "GESTOR"
  }) {
    return apiCall("/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async getChecklists(tipo?: "ABERTURA" | "FECHAMENTO") {
    return apiCall("/api/checklists", { params: tipo ? { tipo } : undefined })
  },

  async toggleChecklist(id: string) {
    return apiCall(`/api/checklists/${id}`, { method: "PATCH" })
  },

  async getDashboard() {
    return apiCall("/dashboard", { auth: "required" })
  },

  async getHealth() {
    return apiCall("/health", { auth: "none" })
  },
}
