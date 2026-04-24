import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { mockIndicadoresTime } from "@/app/(dashboard)/data/mock"

type Colaborador = (typeof mockIndicadoresTime)[number]

const medalhaConfig: Record<string, { label: string; cor: string }> = {
  "top-ticket": { label: "🏆 Maior ticket", cor: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  "sem-atrasos": { label: "⚡ Sem atrasos", cor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  "quase-meta": { label: "🎯 Quase meta", cor: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  "mais-leads": { label: "📈 Mais leads", cor: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  "constante": { label: "🔄 Constante", cor: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20" },
}

const posicaoLabel = ["🥇", "🥈", "🥉"]

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor)
}

function ColaboradorRow({
  colaborador,
  posicao,
}: {
  colaborador: Colaborador
  posicao: number
}) {
  return (
    <div className={cn(
      "rounded-lg border px-4 py-3 space-y-3",
      posicao === 0 && "border-amber-500/30 bg-amber-500/5"
    )}>
      {/* Header do card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">{posicaoLabel[posicao] ?? posicao + 1}</span>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-sm bg-zinc-900 text-white">
              {colaborador.avatar}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{colaborador.nome}</p>
            <p className="text-xs text-muted-foreground">
              {colaborador.vendasMes} vendas no mês
            </p>
          </div>
        </div>
        <p className="text-sm font-bold text-emerald-600">
          {colaborador.vendasMes} aparelhos
        </p>
      </div>

      {/* Barra de meta */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Meta: {colaborador.metaMes} aparelhos
          </span>
          <span className={cn(
            "text-xs font-semibold",
            colaborador.percentualMeta >= 100
              ? "text-emerald-500"
              : colaborador.percentualMeta >= 80
              ? "text-amber-500"
              : "text-red-500"
          )}>
            {colaborador.percentualMeta}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              colaborador.percentualMeta >= 100
                ? "bg-emerald-500"
                : colaborador.percentualMeta >= 80
                ? "bg-amber-500"
                : "bg-red-500"
            )}
            style={{ width: `${Math.min(colaborador.percentualMeta, 100)}%` }}
          />
        </div>
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
          <p className="text-xs text-muted-foreground">Ticket médio</p>
          <p className="text-xs font-semibold">
            {brl(colaborador.ticketMedio)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
          <p className="text-xs text-muted-foreground">Conversão</p>
          <p className={cn(
            "text-xs font-semibold",
            colaborador.taxaConversao >= 35
              ? "text-emerald-500"
              : colaborador.taxaConversao >= 28
              ? "text-amber-500"
              : "text-red-500"
          )}>
            {colaborador.taxaConversao}%
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
          <p className="text-xs text-muted-foreground">Leads ativos</p>
          <p className="text-xs font-semibold">{colaborador.leadsAtivos}</p>
        </div>
      </div>

      {/* Medalhas */}
      {colaborador.medalhas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t">
          {colaborador.medalhas.map((medalha) => {
            const config = medalhaConfig[medalha]
            if (!config) return null
            return (
              <Badge
                key={medalha}
                variant="outline"
                className={cn("text-xs px-1.5 py-0", config.cor)}
              >
                {config.label}
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function RankingPerformance({
  colaboradores,
}: {
  colaboradores: Colaborador[]
}) {
  const ordenado = [...colaboradores].sort(
    (a, b) => b.vendasMes - a.vendasMes
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Ranking de Performance — Março 2026
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ordenado.map((colaborador, i) => (
          <ColaboradorRow
            key={colaborador.id}
            colaborador={colaborador}
            posicao={i}
          />
        ))}
      </CardContent>
    </Card>
  )
}
