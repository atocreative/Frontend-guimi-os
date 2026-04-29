"use client"

import { useEffect, useState } from "react"
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

export function UserStats({ userId, pollMs = 5000 }: UserStatsProps) {
  const [data, setData] = useState<GamificationUserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const nextData = await gamificationService.getUserStats(userId)
      if (!active) return
      setData(nextData)
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

  if (loading) {
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
  }

  if (!data?.available) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Seu progresso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium">Gamificação indisponível</p>
          <p className="text-xs text-muted-foreground">
            {data?.message ?? "Os pontos e badges ainda não estão disponíveis."}
          </p>
        </CardContent>
      </Card>
    )
  }

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
            <>
              Você já atingiu o nível máximo atual.
            </>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Badges</p>
          <Conquistas
            conquistas={mockConquistas}
            desbloqueadas={data.badges.map((badge) => badge.id)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
