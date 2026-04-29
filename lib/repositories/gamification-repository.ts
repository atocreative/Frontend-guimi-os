import type {
  GamificationLeaderboardResponseRaw,
  GamificationScope,
  GamificationUserStatsResponseRaw,
} from "@/types/gamificacao"

export class GamificationRepositoryError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = "GamificationRepositoryError"
  }
}

async function parseJson(response: Response) {
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

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  })

  const data = await parseJson(response)

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Falha ao carregar gamificação."

    throw new GamificationRepositoryError(response.status, message, data)
  }

  return data as T
}

export const gamificationRepository = {
  async getLeaderboard(scope: GamificationScope): Promise<GamificationLeaderboardResponseRaw> {
    return request<GamificationLeaderboardResponseRaw>(`/api/gamificacao/leaderboard?scope=${scope}`)
  },

  async getUserStats(userId: string): Promise<GamificationUserStatsResponseRaw> {
    return request<GamificationUserStatsResponseRaw>(`/api/gamificacao/usuarios/${userId}`)
  },
}
