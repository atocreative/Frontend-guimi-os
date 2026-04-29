"use client"

import { useEffect, useMemo, useState } from "react"
import { Trophy } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { gamificationService } from "@/lib/services/gamification-service"
import { cn } from "@/lib/utils"
import type { GamificationLeaderboardData, GamificationScope } from "@/types/gamificacao"

const medalhas = ["🥇", "🥈", "🥉"] as const

function getInitials(name: string) {
  return name
    .split(" ")
    .map((value) => value[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

interface LeaderboardProps {
  currentUserId?: string
  compact?: boolean
  pollMs?: number
}

export function Leaderboard({
  currentUserId,
  compact = false,
  pollMs = 5000,
}: LeaderboardProps) {
  const [scope, setScope] = useState<GamificationScope>("month")
  const [data, setData] = useState<GamificationLeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const nextData = await gamificationService.getLeaderboard(scope, currentUserId)

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
  }, [currentUserId, pollMs, scope])

  const entries = useMemo(() => data?.entries ?? [], [data])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4" />
            Ranking
          </CardTitle>
          <Tabs value={scope} onValueChange={(value) => setScope(value as GamificationScope)}>
            <TabsList>
              <TabsTrigger value="month">Esse Mês</TabsTrigger>
              <TabsTrigger value="all">Geral</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: compact ? 3 : 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : !data?.available ? (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center">
            <p className="text-sm font-medium">Gamificação indisponível</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data?.message ?? "O backend ainda não liberou o leaderboard."}
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center">
            <p className="text-sm font-medium">Nenhum ranking disponível</p>
            <p className="mt-1 text-xs text-muted-foreground">
              O leaderboard aparecerá quando houver dados de pontuação.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {entries.slice(0, compact ? 3 : 10).map((entry, index) => {
                const isCurrentUser = entry.userId === currentUserId

                return (
                  <div
                    key={`${entry.userId}-${entry.rank}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                      isCurrentUser && "border-primary/40 bg-primary/5"
                    )}
                  >
                    <div className="w-6 text-center text-sm font-semibold text-muted-foreground">
                      {index < 3 ? medalhas[index] : `#${entry.rank}`}
                    </div>
                    <Avatar>
                      {entry.avatarUrl ? <AvatarImage src={entry.avatarUrl} alt={entry.name} /> : null}
                      <AvatarFallback className="bg-zinc-900 text-xs font-bold text-white">
                        {getInitials(entry.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.name}</p>
                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                        <span>{entry.jobTitle ?? entry.role}</span>
                        {entry.badges.slice(0, 2).map((badge) => (
                          <span key={badge.id} aria-label={badge.title}>{badge.emoji}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{entry.points}</p>
                      <div className="flex items-center justify-end gap-1">
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                          {entry.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {data.currentUserRank ? (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Sua posição atual: <span className="font-semibold text-foreground">#{data.currentUserRank}</span>
              </div>
            ) : null}

            {scope === "all" && data.message ? (
              <p className="text-[11px] text-muted-foreground">{data.message}</p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
