import { api, ApiError } from "@/lib/api-client"
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

export const gamificationRepository = {
  async getLeaderboard(scope: GamificationScope): Promise<GamificationLeaderboardResponseRaw> {
    try {
      return await api.getGamificationLeaderboard(scope)
    } catch (error) {
      if (error instanceof ApiError) {
        throw new GamificationRepositoryError(error.status, error.message, error.data)
      }
      throw new GamificationRepositoryError(500, "Falha ao carregar gamificação.", error)
    }
  },

  async getUserStats(userId: string): Promise<GamificationUserStatsResponseRaw> {
    try {
      return await api.getGamificationUserStats(userId)
    } catch (error) {
      if (error instanceof ApiError) {
        throw new GamificationRepositoryError(error.status, error.message, error.data)
      }
      throw new GamificationRepositoryError(500, "Falha ao carregar estatísticas do usuário.", error)
    }
  },
}
