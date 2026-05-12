"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Top3Destaque } from "@/components/gamificacao/top3-destaque"
import { RankingInsights } from "@/components/gamificacao/ranking-insights"
import { Leaderboard } from "@/components/gamificacao/leaderboard"
import { UserStats } from "@/components/gamificacao/user-stats"
import type { GamificationScope } from "@/types/gamificacao"

interface RankingPageClientProps {
  currentUserId: string
  currentUserRole: string
}

export function RankingPageClient({ currentUserId, currentUserRole }: RankingPageClientProps) {
  const [scope, setScope] = useState<GamificationScope>("month")
  const isAdmin = currentUserRole === "ADMIN" || currentUserRole === "SUPER_USER"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Ranking e Gamificação</h1>
        <p className="text-muted-foreground">
          Acompanhe sua posição e desempenho em relação aos demais
        </p>
      </div>

      <Tabs value={scope} onValueChange={(v) => setScope(v as GamificationScope)} className="w-full">
        <TabsList>
          <TabsTrigger value="month">Esse Mês</TabsTrigger>
          <TabsTrigger value="all">Geral</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Visão Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="month" className="space-y-6">
          {/* Top 3 Destaque */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Pódio do Mês</h2>
            <Top3WithFallback scope="month" />
          </section>

          {/* Insights */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Insights</h2>
            <RankingInsightsWithFallback scope="month" />
          </section>

          {/* Leaderboard completo */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Ranking Completo</h2>
            <Leaderboard currentUserId={currentUserId} pollMs={30000} />
          </section>

          {/* Seu progresso */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Seu Desempenho</h2>
            <UserStats userId={currentUserId} pollMs={30000} />
          </section>
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          {/* Top 3 Destaque (Geral) */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Top 3 de Todos os Tempos</h2>
            <Top3WithFallback scope="all" />
          </section>

          {/* Insights (Geral) */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Insights Gerais</h2>
            <RankingInsightsWithFallback scope="all" />
          </section>

          {/* Leaderboard completo */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Ranking Geral</h2>
            <Leaderboard currentUserId={currentUserId} pollMs={30000} />
          </section>

          {/* Seu progresso */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Seu Progresso</h2>
            <UserStats userId={currentUserId} pollMs={30000} />
          </section>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <div className="rounded-lg border border-dashed bg-muted/50 px-6 py-8 text-center">
              <p className="font-medium">Visão Administrativa</p>
              <p className="text-sm text-muted-foreground">
                Detalhes de desempenho individual por colaborador
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Recursos em desenvolvimento
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// Componentes Fallback para evitar erro se Top3Destaque falhar
function Top3WithFallback({ scope }: { scope: GamificationScope }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/50 px-6 py-8 text-center">
      <p className="text-sm text-muted-foreground">
        Carregando top 3 para {scope === "month" ? "este mês" : "todos os tempos"}...
      </p>
    </div>
  )
}

function RankingInsightsWithFallback({ scope }: { scope: GamificationScope }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/50 px-6 py-8 text-center">
      <p className="text-sm text-muted-foreground">
        Insights de {scope === "month" ? "este mês" : "todos os tempos"}
      </p>
    </div>
  )
}
