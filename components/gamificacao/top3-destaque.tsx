"use client"

import { memo } from "react"
import { Award, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { GamificationLeaderboardData } from "@/types/gamificacao"

interface Top3DestaqueProps {
  entries: GamificationLeaderboardData["entries"]
  loading?: boolean
}

const MEDALHAS = [
  { emoji: "🥇", label: "1º lugar", color: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30" },
  { emoji: "🥈", label: "2º lugar", color: "from-slate-400/20 to-slate-500/20 border-slate-400/30" },
  { emoji: "🥉", label: "3º lugar", color: "from-orange-500/20 to-orange-600/20 border-orange-500/30" },
]

const NIVEL_CORES = {
  Bronze: "bg-amber-100 text-amber-900",
  Prata: "bg-slate-200 text-slate-900",
  Ouro: "bg-yellow-100 text-yellow-900",
  Platina: "bg-purple-200 text-purple-900",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((v) => v[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const Top3Card = memo(function Top3Card({
  entry,
  position,
}: {
  entry: GamificationLeaderboardData["entries"][number]
  position: 0 | 1 | 2
}) {
  const medalha = MEDALHAS[position]
  const nivelCor = NIVEL_CORES[entry.level as keyof typeof NIVEL_CORES] || "bg-gray-100 text-gray-900"

  return (
    <Card
      className={cn(
        "relative overflow-hidden border bg-gradient-to-br p-4 transition-all hover:shadow-md",
        medalha.color
      )}
    >
      {/* Rank badge top-right */}
      <div className="absolute right-3 top-3 text-3xl">{medalha.emoji}</div>

      <div className="space-y-3">
        {/* Nome + avatar */}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            {entry.avatarUrl ? <AvatarImage src={entry.avatarUrl} alt={entry.name} /> : null}
            <AvatarFallback className="bg-zinc-900 text-xs font-bold text-white">
              {getInitials(entry.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pr-8">
            <p className="truncate font-semibold text-foreground">{entry.name}</p>
            <p className="truncate text-xs text-muted-foreground">{entry.jobTitle || entry.role}</p>
          </div>
        </div>

        {/* Pontos destacado */}
        <div className="rounded-lg bg-background/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Pontos</p>
          <p className="text-2xl font-bold">{entry.points.toLocaleString()}</p>
        </div>

        {/* Nível */}
        <div className="flex items-center gap-2">
          <Badge className={nivelCor}>
            <Star className="mr-1 h-3 w-3" />
            {entry.level}
          </Badge>
        </div>

        {/* Badges */}
        {entry.badges.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Badges</p>
            <div className="flex flex-wrap gap-1">
              {entry.badges.map((badge) => (
                <span key={badge.id} title={badge.title} className="text-lg">
                  {badge.emoji}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
})

export function Top3Destaque({ entries, loading }: Top3DestaqueProps) {
  const top3 = entries.slice(0, 3)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-48 animate-pulse bg-muted" />
        ))}
      </div>
    )
  }

  if (top3.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 px-6 py-8 text-center">
        <Award className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 font-medium">Ranking ainda não disponível</p>
        <p className="text-sm text-muted-foreground">Os dados aparecerão em breve</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {top3.map((entry, index) => (
        <Top3Card key={`${entry.userId}-top3`} entry={entry} position={index as 0 | 1 | 2} />
      ))}
    </div>
  )
}
