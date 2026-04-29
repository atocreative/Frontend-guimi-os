export type GamificationScope = "month" | "all"
export type GamificationLevel = "Bronze" | "Prata" | "Ouro" | "Platina"
export type GamificationBadgeRarity = "comum" | "raro" | "epico"

export interface GamificationBadgeDefinition {
  id: string
  title: string
  description: string
  emoji: string
  rarity: GamificationBadgeRarity
}

export interface GamificationLeaderboardEntryRaw {
  userId: string
  name: string
  avatarUrl: string | null
  role: string
  jobTitle: string | null
  points: number
  level?: string | null
  badgeIds?: string[]
  rank: number
}

export interface GamificationLeaderboardResponseRaw {
  available: boolean
  scope: GamificationScope
  updatedAt: string | null
  entries: GamificationLeaderboardEntryRaw[]
  message?: string
}

export interface GamificationUserStatsResponseRaw {
  available: boolean
  userId: string
  name: string
  avatarUrl: string | null
  role: string
  points: number
  level?: string | null
  badgeIds?: string[]
  streakDays?: number
  rank?: number | null
  updatedAt: string | null
  message?: string
}

export interface GamificationLeaderboardEntry {
  userId: string
  name: string
  avatarUrl: string | null
  role: string
  jobTitle: string | null
  points: number
  level: GamificationLevel
  badges: GamificationBadgeDefinition[]
  rank: number
}

export interface GamificationLeaderboardData {
  available: boolean
  scope: GamificationScope
  updatedAt: string | null
  entries: GamificationLeaderboardEntry[]
  currentUserRank: number | null
  message?: string
}

export interface GamificationUserStats {
  available: boolean
  userId: string
  name: string
  avatarUrl: string | null
  role: string
  points: number
  level: GamificationLevel
  levelProgress: number
  nextLevel: GamificationLevel | null
  pointsToNextLevel: number
  badges: GamificationBadgeDefinition[]
  streakDays: number
  rank: number | null
  updatedAt: string | null
  message?: string
}

export const GAMIFICATION_BADGE_CATALOG: Record<string, GamificationBadgeDefinition> = {
  streak: {
    id: "streak",
    title: "Streak",
    description: "Completou 5 tarefas em uma semana.",
    emoji: "🔥",
    rarity: "raro",
  },
  precise: {
    id: "precise",
    title: "Precise",
    description: "Terminou o mês sem atrasos.",
    emoji: "🎯",
    rarity: "epico",
  },
  superstar: {
    id: "superstar",
    title: "Superstar",
    description: "Ficou no top 3 do mês.",
    emoji: "🌟",
    rarity: "epico",
  },
}

export const GAMIFICATION_BADGE_FALLBACK: GamificationBadgeDefinition = {
  id: "achievement",
  title: "Conquista",
  description: "Conquista desbloqueada no sistema.",
  emoji: "🏅",
  rarity: "comum",
}
