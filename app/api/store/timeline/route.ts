import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export interface TimelineEvent {
  id: string
  type:
    | "STORE_OPEN"
    | "STORE_CLOSE"
    | "TASK_CREATED"
    | "TASK_COMPLETED"
    | "TASK_LATE"
    | "TASK_RESTORED"
  title: string
  description: string | null
  time: string // ISO
  actor: string | null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100)
  const session = await getSession()
  const token = getSessionAccessToken(session)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const headers = { Authorization: `Bearer ${token}` }
  const opts = { headers, cache: "no-store" as const, signal: AbortSignal.timeout(6_000) }

  const [storeRes, taskRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/store/history?perPage=10`, opts).catch(() => null),
    fetch(`${BACKEND_URL}/api/tasks/history?limit=${limit}`, opts).catch(() => null),
  ])

  const events: TimelineEvent[] = []

  // ── Store events ──────────────────────────────────────────────────────────
  if (storeRes?.ok) {
    const json = await storeRes.json().catch(() => null)
    const entries: any[] = Array.isArray(json?.data) ? json.data : []

    for (const e of entries) {
      if (e.openedAt) {
        events.push({
          id: `store-open-${e.id}`,
          type: "STORE_OPEN",
          title: "Loja aberta",
          description: e.openedBy?.name ? `por ${e.openedBy.name}` : null,
          time: e.openedAt,
          actor: e.openedBy?.name ?? null,
        })
      }
      if (e.closedAt) {
        events.push({
          id: `store-close-${e.id}`,
          type: "STORE_CLOSE",
          title: "Loja fechada",
          description: e.closedBy?.name ? `por ${e.closedBy.name}` : null,
          time: e.closedAt,
          actor: e.closedBy?.name ?? null,
        })
      }
    }
  }

  // ── Task history events ───────────────────────────────────────────────────
  if (taskRes?.ok) {
    const json = await taskRes.json().catch(() => null)
    const entries: any[] = Array.isArray(json?.data) ? json.data : []

    for (const e of entries) {
      const actor = e.performedBy?.name ?? null
      const taskTitle = e.task?.title ?? null

      if (e.action === "CRIOU") {
        events.push({
          id: `task-created-${e.id}`,
          type: "TASK_CREATED",
          title: "Tarefa criada",
          description: taskTitle ? (actor ? `"${taskTitle}" por ${actor}` : `"${taskTitle}"`) : actor,
          time: e.createdAt,
          actor,
        })
      } else if (e.action === "TASK_COMPLETED") {
        events.push({
          id: `task-done-${e.id}`,
          type: "TASK_COMPLETED",
          title: "Tarefa concluída",
          description: taskTitle ? (actor ? `"${taskTitle}" por ${actor}` : `"${taskTitle}"`) : actor,
          time: e.createdAt,
          actor,
        })
      } else if (e.action === "TASK_COMPLETED_LATE") {
        events.push({
          id: `task-late-${e.id}`,
          type: "TASK_LATE",
          title: "Concluída com atraso",
          description: taskTitle ? (actor ? `"${taskTitle}" por ${actor}` : `"${taskTitle}"`) : actor,
          time: e.createdAt,
          actor,
        })
      } else if (e.action === "TASK_RESTORED") {
        events.push({
          id: `task-restored-${e.id}`,
          type: "TASK_RESTORED",
          title: "Tarefa restaurada",
          description: taskTitle ? (actor ? `"${taskTitle}" por ${actor}` : `"${taskTitle}"`) : actor,
          time: e.createdAt,
          actor,
        })
      }
    }
  }

  // Sort newest first, cap at 20
  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return NextResponse.json({ events: events.slice(0, limit) })
}
