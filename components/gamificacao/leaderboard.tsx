"use client"

import { memo, useEffect, useMemo, useState } from "react"
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

function isSameLeaderboardData(
  previous: GamificationLeaderboardData | null,
  next: GamificationLeaderboardData
) {
  if (!previous) return false
  if (
    previous.available !== next.available ||
    previous.scope !== next.scope ||
    previous.updatedAt !== next.updatedAt ||
    previous.currentUserRank !== next.currentUserRank ||
    previous.message !== next.message ||
    previous.entries.length !== next.entries.length
  ) {
    return false
  }

  return previous.entries.every((entry, index) => {
    const nextEntry = next.entries[index]

    return (
      entry.userId === nextEntry.userId &&
      entry.rank === nextEntry.rank &&
      entry.points === nextEntry.points &&
      entry.level === nextEntry.level &&
      entry.name === nextEntry.name &&
      entry.avatarUrl === nextEntry.avatarUrl &&
      entry.jobTitle === nextEntry.jobTitle &&
      entry.badges.length === nextEntry.badges.length &&
      entry.badges.every((badge, badgeIndex) => badge.id === nextEntry.badges[badgeIndex]?.id)
    )
  })
}

interface LeaderboardRowProps {
  entry: GamificationLeaderboardData["entries"][number]
  index: number
  isCurrentUser: boolean
}

const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  index,
  isCurrentUser,
}: LeaderboardRowProps) {
  const displayRank = index < 3 ? medalhas[index] : `#${entry.rank}`
  const visibleBadges = entry.badges.slice(0, 2)

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
        isCurrentUser && "border-primary/40 bg-primary/5"
      )}
    >
      <div className="w-6 text-center text-sm font-semibold text-muted-foreground">
        {displayRank}
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
          {visibleBadges.map((badge) => (
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
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.entry.userId === nextProps.entry.userId &&
    prevProps.entry.rank === nextProps.entry.rank &&
    prevProps.entry.points === nextProps.entry.points &&
    prevProps.entry.level === nextProps.entry.level &&
    prevProps.entry.name === nextProps.entry.name &&
    prevProps.entry.avatarUrl === nextProps.entry.avatarUrl &&
    prevProps.entry.jobTitle === nextProps.entry.jobTitle &&
    prevProps.entry.badges.length === nextProps.entry.badges.length &&
    prevProps.index === nextProps.index &&
    prevProps.isCurrentUser === nextProps.isCurrentUser
  )
})

interface LeaderboardProps {
  currentUserId?: string
  compact?: boolean
  pollMs?: number
}

export function Leaderboard({
  currentUserId,
  compact = false,
  pollMs = 10000,
}: LeaderboardProps) {
  const [scope, setScope] = useState<GamificationScope>("month")
  const [data, setData] = useState<GamificationLeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      if (document.visibilityState === "hidden") {
        return
      }

      const nextData = await gamificationService.getLeaderboard(scope, currentUserId)

      if (!active) return

      setData((previous) =>
        isSameLeaderboardData(previous, nextData) ? previous : nextData
      )
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
  const visibleEntries = useMemo(
    () => entries.slice(0, compact ? 3 : 10),
    [compact, entries]
  )

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
              {visibleEntries.map((entry, index) => (
                <LeaderboardRow
                  key={`${entry.userId}-${entry.rank}`}
                  entry={entry}
                  index={index}
                  isCurrentUser={entry.userId === currentUserId}
                />
              ))}
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
