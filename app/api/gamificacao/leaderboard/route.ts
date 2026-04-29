import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth-session"
import { backendFetch, extractUsersPayload, getSessionAccessToken } from "@/lib/backend-api"
import type {
  GamificationLeaderboardEntryRaw,
  GamificationLeaderboardResponseRaw,
  GamificationScope,
} from "@/types/gamificacao"

function toRoleJobTitle(entry: Record<string, unknown>) {
  return {
    role: typeof entry.role === "string" ? entry.role : "COLABORADOR",
    jobTitle: typeof entry.jobTitle === "string" ? entry.jobTitle : null,
  }
}

function mapMonthEntry(entry: Record<string, unknown>, index: number): GamificationLeaderboardEntryRaw {
  const { role, jobTitle } = toRoleJobTitle(entry)

  return {
    userId:
      typeof entry.userId === "string"
        ? entry.userId
        : typeof entry.id === "string"
          ? entry.id
          : `ranking-${index + 1}`,
    name:
      typeof entry.name === "string"
        ? entry.name
        : typeof entry.nome === "string"
          ? entry.nome
          : "Colaborador",
    avatarUrl:
      typeof entry.avatarUrl === "string"
        ? entry.avatarUrl
        : typeof entry.avatar === "string" && entry.avatar.startsWith("http")
          ? entry.avatar
          : null,
    role,
    jobTitle,
    points:
      typeof entry.points === "number"
        ? entry.points
        : typeof entry.pontos === "number"
          ? entry.pontos
          : typeof entry.pontosMes === "number"
            ? entry.pontosMes
            : 0,
    level:
      typeof entry.level === "string"
        ? entry.level
        : typeof entry.nivel === "string"
          ? entry.nivel
          : null,
    badgeIds: Array.isArray(entry.badgeIds)
      ? entry.badgeIds.filter((value): value is string => typeof value === "string")
      : Array.isArray(entry.medalhas)
        ? entry.medalhas.filter((value): value is string => typeof value === "string")
        : Array.isArray(entry.conquistasDesbloqueadas)
          ? entry.conquistasDesbloqueadas.filter((value): value is string => typeof value === "string")
          : [],
    rank:
      typeof entry.rank === "number"
        ? entry.rank
        : typeof entry.posicao === "number"
          ? entry.posicao
          : index + 1,
  }
}

function mapAllTimeEntry(entry: Record<string, unknown>, index: number): GamificationLeaderboardEntryRaw {
  const { role, jobTitle } = toRoleJobTitle(entry)

  return {
    userId: typeof entry.id === "string" ? entry.id : `user-${index + 1}`,
    name: typeof entry.name === "string" ? entry.name : "Colaborador",
    avatarUrl: typeof entry.avatarUrl === "string" ? entry.avatarUrl : null,
    role,
    jobTitle,
    points: typeof entry.points === "number" ? entry.points : 0,
    level: typeof entry.level === "string" ? entry.level : null,
    badgeIds: [],
    rank: index + 1,
  }
}

function buildUnavailable(scope: GamificationScope, message: string): GamificationLeaderboardResponseRaw {
  return {
    available: false,
    scope,
    updatedAt: null,
    entries: [],
    message,
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  if (!session?.user || !token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const scope = req.nextUrl.searchParams.get("scope") === "all" ? "all" : "month"

  if (scope === "month") {
    const result = await backendFetch("/api/gamification/leaderboard", { token })

    if (result.response.status === 404 || result.response.status === 501 || result.response.status === 503) {
      return Response.json(buildUnavailable(scope, "Leaderboard indisponível no backend no momento."))
    }

    if (result.response.ok && result.data && typeof result.data === "object") {
      const payload = result.data as Record<string, unknown>
      const rawEntries = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.entries)
          ? payload.entries
          : Array.isArray(payload.leaderboard)
            ? payload.leaderboard
            : []

      return Response.json({
        available: true,
        scope,
        updatedAt: new Date().toISOString(),
        entries: rawEntries
          .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
          .slice(0, 10)
          .map(mapMonthEntry),
      } satisfies GamificationLeaderboardResponseRaw)
    }

    return Response.json(buildUnavailable(scope, "Leaderboard indisponível no backend no momento."))
  }

  const usersResult = await backendFetch("/api/users", { token, params: { orderBy: "name" } })

  if (!usersResult.response.ok) {
    return Response.json(buildUnavailable(scope, "Não foi possível carregar usuários para o ranking geral."))
  }

  const { users } = extractUsersPayload(usersResult.data)

  return Response.json({
    available: true,
    scope,
    updatedAt: new Date().toISOString(),
    entries: users.slice(0, 10).map((user, index) =>
      mapAllTimeEntry(
        {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          jobTitle: user.jobTitle,
          points: 0,
          level: null,
        },
        index
      )
    ),
    message: "Ranking geral exibido sem pontuação confirmada do backend.",
  } satisfies GamificationLeaderboardResponseRaw)
}
