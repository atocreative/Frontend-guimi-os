import { getSession } from "@/lib/auth-session"
import { backendFetch, extractUserPayload, getSessionAccessToken } from "@/lib/backend-api"
import type { GamificationUserStatsResponseRaw } from "@/types/gamificacao"

function buildUnavailable(userId: string, message: string): GamificationUserStatsResponseRaw {
  return {
    available: false,
    userId,
    name: "",
    avatarUrl: null,
    role: "COLABORADOR",
    points: 0,
    badgeIds: [],
    streakDays: 0,
    rank: null,
    updatedAt: null,
    message,
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params

  const [userResult, gamificationResult] = await Promise.all([
    backendFetch(`/api/users/${id}`, { token }),
    backendFetch(`/api/gamification/user/${id}`, { token }),
  ])

  if (!userResult.response.ok) {
    return Response.json(buildUnavailable(id, "Não foi possível carregar o usuário da gamificação."))
  }

  const user = extractUserPayload(userResult.data)

  if (gamificationResult.response.status === 404 || gamificationResult.response.status === 501 || gamificationResult.response.status === 503) {
    return Response.json({
      available: false,
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      points: 0,
      badgeIds: [],
      streakDays: 0,
      rank: null,
      updatedAt: null,
      message: "Gamificação do usuário indisponível no backend no momento.",
    } satisfies GamificationUserStatsResponseRaw)
  }

  if (gamificationResult.response.ok && gamificationResult.data && typeof gamificationResult.data === "object") {
    const payload = gamificationResult.data as Record<string, unknown>
    const raw = (payload.data ?? payload.user ?? payload.usuario ?? payload) as Record<string, unknown>

    return Response.json({
      available: true,
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      points:
        typeof raw.points === "number"
          ? raw.points
          : typeof raw.pontos === "number"
            ? raw.pontos
            : typeof raw.pontosMes === "number"
              ? raw.pontosMes
              : 0,
      level:
        typeof raw.level === "string"
          ? raw.level
          : typeof raw.nivel === "string"
            ? raw.nivel
            : null,
      badgeIds: Array.isArray(raw.badgeIds)
        ? raw.badgeIds.filter((value): value is string => typeof value === "string")
        : Array.isArray(raw.medalhas)
          ? raw.medalhas.filter((value): value is string => typeof value === "string")
          : Array.isArray(raw.conquistasDesbloqueadas)
            ? raw.conquistasDesbloqueadas.filter((value): value is string => typeof value === "string")
            : [],
      streakDays:
        typeof raw.streakDays === "number"
          ? raw.streakDays
          : typeof raw.sequenciaDias === "number"
            ? raw.sequenciaDias
            : 0,
      rank: typeof raw.rank === "number" ? raw.rank : null,
      updatedAt: new Date().toISOString(),
    } satisfies GamificationUserStatsResponseRaw)
  }

  return Response.json({
    available: false,
    userId: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    points: 0,
    badgeIds: [],
    streakDays: 0,
    rank: null,
    updatedAt: null,
    message: "Gamificação do usuário indisponível no backend no momento.",
  } satisfies GamificationUserStatsResponseRaw)
}
