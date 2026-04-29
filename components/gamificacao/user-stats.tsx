"use client"

import { memo, useEffect, useMemo, useState } from "react"
import { Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Conquistas } from "@/components/colaboradores/conquistas"
import { NivelBadge } from "@/components/colaboradores/nivel-badge"
import { gamificationService } from "@/lib/services/gamification-service"
import type { GamificationUserStats } from "@/types/gamificacao"
import { mockConquistas } from "@/app/(dashboard)/data/mock"

interface UserStatsProps {
  userId: string
  pollMs?: number
}

function isSameUserStats(previous: GamificationUserStats | null, next: GamificationUserStats) {
  if (!previous) return false

  return (
    previous.available === next.available &&
    previous.userId === next.userId &&
    previous.points === next.points &&
    previous.level === next.level &&
    previous.levelProgress === next.levelProgress &&
    previous.nextLevel === next.nextLevel &&
    previous.pointsToNextLevel === next.pointsToNextLevel &&
    previous.streakDays === next.streakDays &&
    previous.rank === next.rank &&
    previous.updatedAt === next.updatedAt &&
    previous.message === next.message &&
    previous.badges.length === next.badges.length &&
    previous.badges.every((badge, index) => badge.id === next.badges[index]?.id)
  )
}

interface UserStatsLoadingProps {
  children?: React.ReactNode
}

const UserStatsLoading = memo(function UserStatsLoading() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Seu progresso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </CardContent>
    </Card>
  )
})

interface UserStatsUnavailableProps {
  message?: string
}

const UserStatsUnavailable = memo(function UserStatsUnavailable({ message }: UserStatsUnavailableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Seu progresso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium">Gamificação indisponível</p>
        <p className="text-xs text-muted-foreground">
          {message ?? "Os pontos e badges ainda não estão disponíveis."}
        </p>
      </CardContent>
    </Card>
  )
})

interface UserStatsContentProps {
  data: GamificationUserStats
  unlockedBadges: string[]
}

const UserStatsContent = memo(function UserStatsContent({ data, unlockedBadges }: UserStatsContentProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Seu progresso
          </CardTitle>
          {data.rank ? (
            <span className="text-xs text-muted-foreground">Posição #{data.rank}</span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <NivelBadge
          nivel={data.level}
          pontos={data.points}
          progresso={data.levelProgress}
          sequencia={data.streakDays}
        />

        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {data.nextLevel ? (
            <>
              Próxima meta: <span className="font-semibold text-foreground">{data.pointsToNextLevel} pontos</span> para {data.nextLevel}
            </>
          ) : (
            <>Você já atingiu o nível máximo atual.</>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Badges</p>
          <Conquistas
            conquistas={mockConquistas}
            desbloqueadas={unlockedBadges}
          />
        </div>
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.data.userId === nextProps.data.userId &&
    prevProps.data.points === nextProps.data.points &&
    prevProps.data.level === nextProps.data.level &&
    prevProps.data.levelProgress === nextProps.data.levelProgress &&
    prevProps.data.nextLevel === nextProps.data.nextLevel &&
    prevProps.data.pointsToNextLevel === nextProps.data.pointsToNextLevel &&
    prevProps.data.streakDays === nextProps.data.streakDays &&
    prevProps.data.rank === nextProps.data.rank &&
    prevProps.unlockedBadges.length === nextProps.unlockedBadges.length &&
    prevProps.unlockedBadges.every((id, index) => id === nextProps.unlockedBadges[index])
  )
})

export function UserStats({ userId, pollMs = 10000 }: UserStatsProps) {
  const [data, setData] = useState<GamificationUserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      if (document.visibilityState === "hidden") {
        return
      }

      const nextData = await gamificationService.getUserStats(userId)
      if (!active) return

      setData((previous) => (isSameUserStats(previous, nextData) ? previous : nextData))
      setLoading(false)
    }

    void load()

    const interval = window.setInterval(() => {
      void load()
    }, pollMs)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [pollMs, userId])

  const unlockedBadges = useMemo(
    () => data?.badges.map((badge) => badge.id) ?? [],
    [data?.badges]
  )

  if (loading) {
    return <UserStatsLoading />
  }

  if (!data?.available) {
    return <UserStatsUnavailable message={data?.message} />
  }

  return <UserStatsContent data={data} unlockedBadges={unlockedBadges} />
}
