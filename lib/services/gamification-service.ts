import { gamificationRepository, GamificationRepositoryError } from "@/lib/repositories/gamification-repository"
import {
  GAMIFICATION_BADGE_CATALOG,
  GAMIFICATION_BADGE_FALLBACK,
  type GamificationBadgeDefinition,
  type GamificationLeaderboardData,
  type GamificationLeaderboardResponseRaw,
  type GamificationLevel,
  type GamificationScope,
  type GamificationUserStats,
  type GamificationUserStatsResponseRaw,
} from "@/types/gamificacao"

export function getGamificationLevel(points: number): GamificationLevel {
  if (points >= 600) return "Platina"
  if (points >= 301) return "Ouro"
  if (points >= 101) return "Prata"
  return "Bronze"
}

export function getGamificationProgress(points: number) {
  if (points >= 600) {
    return {
      level: "Platina" as const,
      nextLevel: null,
      levelProgress: 100,
      pointsToNextLevel: 0,
    }
  }

  if (points >= 301) {
    return {
      level: "Ouro" as const,
      nextLevel: "Platina" as const,
      levelProgress: Math.max(0, Math.min(100, Math.round(((points - 301) / (599 - 301)) * 100))),
      pointsToNextLevel: Math.max(0, 600 - points),
    }
  }

  if (points >= 101) {
    return {
      level: "Prata" as const,
      nextLevel: "Ouro" as const,
      levelProgress: Math.max(0, Math.min(100, Math.round(((points - 101) / (300 - 101)) * 100))),
      pointsToNextLevel: Math.max(0, 301 - points),
    }
  }

  return {
    level: "Bronze" as const,
    nextLevel: "Prata" as const,
    levelProgress: Math.max(0, Math.min(100, Math.round((points / 100) * 100))),
    pointsToNextLevel: Math.max(0, 101 - points),
  }
}

export function resolveGamificationBadges(badgeIds: string[] = []): GamificationBadgeDefinition[] {
  return badgeIds.map((badgeId) => {
    const normalizedId = badgeId.trim().toLowerCase()

    return (
      GAMIFICATION_BADGE_CATALOG[normalizedId] ?? {
        ...GAMIFICATION_BADGE_FALLBACK,
        id: normalizedId || GAMIFICATION_BADGE_FALLBACK.id,
        title: badgeId || GAMIFICATION_BADGE_FALLBACK.title,
      }
    )
  })
}

function buildUnavailableLeaderboard(scope: GamificationScope, message?: string): GamificationLeaderboardData {
  return {
    available: false,
    scope,
    updatedAt: null,
    entries: [],
    currentUserRank: null,
    message: message ?? "Gamificação indisponível no momento.",
  }
}

function buildUnavailableUserStats(userId: string, message?: string): GamificationUserStats {
  const progress = getGamificationProgress(0)

  return {
    available: false,
    userId,
    name: "",
    avatarUrl: null,
    role: "COLABORADOR",
    points: 0,
    level: progress.level,
    levelProgress: progress.levelProgress,
    nextLevel: progress.nextLevel,
    pointsToNextLevel: progress.pointsToNextLevel,
    badges: [],
    streakDays: 0,
    rank: null,
    updatedAt: null,
    message: message ?? "Gamificação indisponível no momento.",
  }
}

function mapLeaderboard(raw: GamificationLeaderboardResponseRaw, currentUserId?: string): GamificationLeaderboardData {
  const entries = raw.entries.map((entry) => ({
    userId: entry.userId,
    name: entry.name,
    avatarUrl: entry.avatarUrl,
    role: entry.role,
    jobTitle: entry.jobTitle,
    points: entry.points,
    level: (entry.level as GamificationLevel | null) ?? getGamificationLevel(entry.points),
    badges: resolveGamificationBadges(entry.badgeIds),
    rank: entry.rank,
  }))

  const currentUserRank = currentUserId
    ? entries.find((entry) => entry.userId === currentUserId)?.rank ?? null
    : null

  return {
    available: raw.available,
    scope: raw.scope,
    updatedAt: raw.updatedAt,
    entries,
    currentUserRank,
    message: raw.message,
  }
}

function mapUserStats(raw: GamificationUserStatsResponseRaw): GamificationUserStats {
  const progress = getGamificationProgress(raw.points)

  return {
    available: raw.available,
    userId: raw.userId,
    name: raw.name,
    avatarUrl: raw.avatarUrl,
    role: raw.role,
    points: raw.points,
    level: (raw.level as GamificationLevel | null) ?? progress.level,
    levelProgress: progress.levelProgress,
    nextLevel: progress.nextLevel,
    pointsToNextLevel: progress.pointsToNextLevel,
    badges: resolveGamificationBadges(raw.badgeIds),
    streakDays: raw.streakDays ?? 0,
    rank: raw.rank ?? null,
    updatedAt: raw.updatedAt,
    message: raw.message,
  }
}

export const gamificationService = {
  async getLeaderboard(scope: GamificationScope, currentUserId?: string): Promise<GamificationLeaderboardData> {
    try {
      const raw = await gamificationRepository.getLeaderboard(scope)
      return mapLeaderboard(raw, currentUserId)
    } catch (error) {
      if (error instanceof GamificationRepositoryError) {
        return buildUnavailableLeaderboard(scope, error.message)
      }

      return buildUnavailableLeaderboard(scope)
    }
  },

  async getUserStats(userId: string): Promise<GamificationUserStats> {
    try {
      const raw = await gamificationRepository.getUserStats(userId)
      return mapUserStats(raw)
    } catch (error) {
      if (error instanceof GamificationRepositoryError) {
        return buildUnavailableUserStats(userId, error.message)
      }

      return buildUnavailableUserStats(userId)
    }
  },
}
