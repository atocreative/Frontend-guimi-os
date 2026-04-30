import type { ChecklistDB, ChecklistItemDB, TarefaDB, UsuarioSimples } from "@/types/tarefas"
import type { UsuarioDB } from "@/types/usuarios"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"

interface BackendFetchOptions extends RequestInit {
  token?: string
  params?: Record<string, string | number | boolean | null | undefined>
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

async function parseBackendResponse(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function normalizeAssignee(input: unknown): UsuarioSimples | null {
  if (!isObject(input)) {
    return null
  }

  return {
    id: typeof input.id === "string" ? input.id : "",
    name: typeof input.name === "string" ? input.name : "",
    avatarUrl: typeof input.avatarUrl === "string" ? input.avatarUrl : null,
    role: typeof input.role === "string" ? input.role : "COLABORADOR",
    jobTitle: typeof input.jobTitle === "string" ? input.jobTitle : null,
  }
}

function normalizeTask(input: unknown): TarefaDB {
  const task = isObject(input) ? input : {}

  return {
    id: typeof task.id === "string" ? task.id : "",
    title: typeof task.title === "string" ? task.title : "",
    description: typeof task.description === "string" ? task.description : null,
    status: typeof task.status === "string" ? task.status as TarefaDB["status"] : "PENDENTE",
    priority:
      task.priority === "ALTA" || task.priority === "MEDIA" || task.priority === "BAIXA"
        ? task.priority
        : null,
    dueAt: typeof task.dueAt === "string" ? task.dueAt : null,
    horario: typeof task.horario === "string" ? task.horario : null,
    assigneeId: typeof task.assigneeId === "string" ? task.assigneeId : null,
    assignee: normalizeAssignee(task.assignee),
    createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date(0).toISOString(),
    updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : new Date(0).toISOString(),
    completedAt: typeof task.completedAt === "string" ? task.completedAt : null,
    createdBy: typeof task.createdBy === "string" ? task.createdBy : null,
  }
}

function normalizeUser(input: unknown): UsuarioDB {
  const user = isObject(input) ? input : {}

  return {
    id: typeof user.id === "string" ? user.id : "",
    name: typeof user.name === "string" ? user.name : "",
    email: typeof user.email === "string" ? user.email : "",
    role:
      user.role === "ADMIN" || user.role === "GESTOR" || user.role === "COLABORADOR" || user.role === "SUPER_USER"
        ? user.role
        : "COLABORADOR",
    avatarUrl: typeof user.avatarUrl === "string" ? user.avatarUrl : null,
    jobTitle: typeof user.jobTitle === "string" ? user.jobTitle : null,
    active: typeof user.active === "boolean" ? user.active : true,
    createdAt: typeof user.createdAt === "string" ? user.createdAt : new Date(0).toISOString(),
    updatedAt: typeof user.updatedAt === "string" ? user.updatedAt : undefined,
  }
}

function normalizeChecklistItem(input: unknown): ChecklistItemDB {
  const item = isObject(input) ? input : {}

  return {
    id: typeof item.id === "string" ? item.id : "",
    title:
      typeof item.title === "string"
        ? item.title
        : typeof item.titulo === "string"
          ? item.titulo
          : "",
    description:
      typeof item.description === "string"
        ? item.description
        : typeof item.descricao === "string"
          ? item.descricao
          : null,
    completed:
      typeof item.completed === "boolean"
        ? item.completed
        : typeof item.concluido === "boolean"
          ? item.concluido
          : false,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : undefined,
  }
}

function normalizeChecklist(input: unknown): ChecklistDB {
  const checklist = isObject(input) ? input : {}
  const items = Array.isArray(checklist.items) ? checklist.items.map(normalizeChecklistItem) : []

  return {
    id: typeof checklist.id === "string" ? checklist.id : "",
    title:
      typeof checklist.title === "string"
        ? checklist.title
        : typeof checklist.titulo === "string"
          ? checklist.titulo
          : "",
    description:
      typeof checklist.description === "string"
        ? checklist.description
        : typeof checklist.descricao === "string"
          ? checklist.descricao
          : null,
    tipo: checklist.tipo === "FECHAMENTO" ? "FECHAMENTO" : "ABERTURA",
    color: typeof checklist.color === "string" ? checklist.color : null,
    items,
    createdAt: typeof checklist.createdAt === "string" ? checklist.createdAt : undefined,
    updatedAt: typeof checklist.updatedAt === "string" ? checklist.updatedAt : undefined,
  }
}

export function getSessionAccessToken(session: { accessToken?: string | null } | null | undefined) {
  return session?.accessToken ?? null
}

export async function backendFetch(path: string, options: BackendFetchOptions = {}) {
  const { token, params, headers, ...init } = options
  const url = new URL(path, API_BASE)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const requestHeaders = new Headers(headers)
  requestHeaders.set("Accept", "application/json")

  if (!requestHeaders.has("Content-Type") && init.body) {
    requestHeaders.set("Content-Type", "application/json")
  }

  if (token) {
    const tokenStr = String(token)
    console.log("[backendFetch] Token info:", {
      path,
      tokenLength: tokenStr.length,
      tokenStart: tokenStr.substring(0, 50),
      tokenEnd: tokenStr.substring(Math.max(0, tokenStr.length - 20)),
      headerValue: `Bearer ${tokenStr.substring(0, 30)}...`,
    })
    requestHeaders.set("Authorization", `Bearer ${tokenStr}`)
  } else {
    console.warn("[backendFetch] No token provided for", path)
  }

  const response = await fetch(url, {
    ...init,
    headers: requestHeaders,
    cache: init.cache ?? "no-store",
  })

  const data = await parseBackendResponse(response)

  return { response, data }
}

export async function backendLogin(payload: { email: string; password: string; captchaToken?: string; captchaAnswer?: string }) {
  const { response, data } = await backendFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return { response, data }
}

export async function backendVerifyMfa(payload: { challengeToken: string; code: string }) {
  const { response, data } = await backendFetch("/api/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return { response, data }
}

export function extractTasksPayload(data: unknown) {
  const payload = isObject(data) ? data : {}
  const items = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.tasks)
      ? payload.tasks
      : Array.isArray(payload.tarefas)
        ? payload.tarefas
        : []

  return {
    tasks: items.map(normalizeTask),
    total: typeof payload.total === "number" ? payload.total : items.length,
  }
}

export function extractTaskPayload(data: unknown) {
  const payload = isObject(data) ? data : {}
  const task = payload.tarefa ?? payload.data ?? payload
  return normalizeTask(task)
}

export function extractUsersPayload(data: unknown) {
  const payload = isObject(data) ? data : {}
  const items = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.users)
      ? payload.users
      : Array.isArray(payload.usuarios)
        ? payload.usuarios
        : []

  return {
    users: items.map(normalizeUser),
    total: typeof payload.total === "number" ? payload.total : items.length,
  }
}

export function extractUserPayload(data: unknown) {
  const payload = isObject(data) ? data : {}
  return normalizeUser(payload.usuario ?? payload.data ?? payload)
}

export function extractChecklistsPayload(data: unknown) {
  const payload = isObject(data) ? data : {}
  const items = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.checklists)
      ? payload.checklists
      : []

  return items.map(normalizeChecklist)
}

export function extractChecklistItemPayload(data: unknown) {
  const payload = isObject(data) ? data : {}
  return normalizeChecklistItem(payload.item ?? payload.data ?? payload)
}

export { API_BASE }
