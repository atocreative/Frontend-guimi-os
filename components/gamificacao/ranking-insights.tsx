"use client"

import { memo } from "react"
import { Activity, Flame, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GamificationLeaderboardData, GamificationScope } from "@/types/gamificacao"

interface RankingInsightsProps {
  entries: GamificationLeaderboardData["entries"]
  scope: GamificationScope
}

const RankingInsights = memo(function RankingInsights({ entries, scope }: RankingInsightsProps) {
  // Calcular insights
  const totalParticipantes = entries.length
  const mediaPoints = totalParticipantes > 0 ? Math.round(entries.reduce((sum, e) => sum + e.points, 0) / totalParticipantes) : 0
  const topPoints = entries[0]?.points || 0

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Participantes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4" />
            Participantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalParticipantes}</p>
          <p className="text-xs text-muted-foreground">
            {scope === "month" ? "Neste mês" : "Em todos os tempos"}
          </p>
        </CardContent>
      </Card>

      {/* Top Score */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4 text-yellow-500" />
            Maior Pontuação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{topPoints.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            {entries[0]?.name.split(" ")[0]}
          </p>
        </CardContent>
      </Card>

      {/* Score Médio */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Flame className="h-4 w-4 text-orange-500" />
            Pontuação Média
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{mediaPoints.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            Entre participantes
          </p>
        </CardContent>
      </Card>
    </div>
  )
})

export { RankingInsights }
