'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info, Users, TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { Lead } from '@/app/(dashboard)/comercial/data/mock'

interface ComercialKpisProps {
  leads: Lead[]
}

function calcularTempoMedioResposta(leads: Lead[]): number {
  // Simulado: calcula baseado em dias parado
  const dias = leads.filter((l) => l.diasParado > 0).map((l) => l.diasParado)
  if (dias.length === 0) return 0
  return Math.round(dias.reduce((a, b) => a + b, 0) / dias.length)
}

export function ComercialKpis({ leads }: ComercialKpisProps) {
  const leadsAtivos = leads.filter(
    (l) => l.etapa !== 'fechado_ganho' && l.etapa !== 'fechado_perdido'
  )
  const leadsGanhos = leads.filter((l) => l.etapa === 'fechado_ganho')
  const leadsPerdidos = leads.filter((l) => l.etapa === 'fechado_perdido')
  const taxaConversao = leads.length > 0 ? Math.round((leadsGanhos.length / leads.length) * 100) : 0
  const tempoMedioResposta = calcularTempoMedioResposta(leadsAtivos)

  // Canal insights
  const canalCounts: Record<string, { ganhos: number; total: number }> = {}
  leads.forEach((l) => {
    const canal = l.origem ?? 'Outros'
    if (!canalCounts[canal]) canalCounts[canal] = { ganhos: 0, total: 0 }
    canalCounts[canal].total += 1
    if (l.etapa === 'fechado_ganho') canalCounts[canal].ganhos += 1
  })
  const canais = Object.entries(canalCounts)
    .map(([canal, { ganhos, total }]) => ({ canal, ganhos, total, taxa: total > 0 ? Math.round((ganhos / total) * 100) : 0 }))
    .sort((a, b) => b.taxa - a.taxa)
  const canalCampeao = canais[0]
  const canalPior = canais[canais.length - 1]

  const kpis = [
    {
      label: 'Leads Ativos',
      value: leadsAtivos.length,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      tooltip: 'O que é: Leads em negociação que ainda não foram ganhos nem perdidos. Quanto maior, mais robusto o pipeline.\n\nOrigem: CRM interno.\n\nAtualização: Tempo real.',
    },
    {
      label: 'Leads Ganhos',
      value: leadsGanhos.length,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      tooltip: 'O que é: Leads convertidos em vendas no período selecionado.\n\nOrigem: CRM interno.\n\nAtualização: Tempo real.',
    },
    {
      label: 'Leads Perdidos',
      value: leadsPerdidos.length,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      tooltip: 'O que é: Leads encerrados sem conversão. Alta proporção vs ganhos indica problema no processo ou qualificação.\n\nOrigem: CRM interno.\n\nAtualização: Tempo real.',
    },
    {
      label: 'Taxa Conversão',
      value: `${taxaConversao}%`,
      icon: TrendingUp,
      color: taxaConversao >= 20 ? 'text-emerald-600' : taxaConversao >= 10 ? 'text-amber-600' : 'text-red-600',
      bg: taxaConversao >= 20 ? 'bg-emerald-50' : taxaConversao >= 10 ? 'bg-amber-50' : 'bg-red-50',
      tooltip: 'O que é: Leads ganhos ÷ total de leads. Meta: acima de 20%. Abaixo de 10% indica problema no processo de vendas.\n\nOrigem: Calculado em tempo real a partir do CRM interno.\n\nAtualização: Tempo real.',
      sub: taxaConversao >= 20 ? '✓ Meta atingida' : taxaConversao >= 10 ? 'Próximo da meta' : 'Abaixo da meta',
    },
    {
      label: 'Tempo Médio Resposta',
      value: `${tempoMedioResposta}d`,
      icon: Clock,
      color: tempoMedioResposta <= 1 ? 'text-emerald-600' : tempoMedioResposta <= 3 ? 'text-amber-600' : 'text-red-600',
      bg: tempoMedioResposta <= 1 ? 'bg-emerald-50' : tempoMedioResposta <= 3 ? 'bg-amber-50' : 'bg-red-50',
      tooltip: 'O que é: Média de dias sem resposta para leads ativos. Meta: até 1 dia. Acima de 3 dias aumenta o risco de perda.\n\nOrigem: Calculado em tempo real a partir do CRM interno.\n\nAtualização: Tempo real.',
      sub: tempoMedioResposta <= 1 ? 'Excelente' : tempoMedioResposta <= 3 ? 'Aceitável' : 'Atenção',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className={`rounded-lg ${kpi.bg} p-2.5 mb-2 w-fit`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Sobre ${kpi.label}`}
                          className="rounded-full p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors focus:outline-none"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] whitespace-pre-line text-xs leading-snug">
                        {kpi.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                {kpi.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.sub}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {canais.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {canalCampeao && (
            <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3 flex items-start gap-2.5">
              <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Canal campeão</p>
                <p className="text-sm font-bold">{canalCampeao.canal}</p>
                <p className="text-[11px] text-muted-foreground">{canalCampeao.taxa}% conversão · {canalCampeao.total} leads</p>
              </div>
            </div>
          )}
          {canalPior && canalPior.canal !== canalCampeao?.canal && canalPior.total >= 3 && (
            <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 flex items-start gap-2.5">
              <XCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Baixa conversão</p>
                <p className="text-sm font-bold">{canalPior.canal}</p>
                <p className="text-[11px] text-muted-foreground">{canalPior.taxa}% conversão · {canalPior.total} leads</p>
              </div>
            </div>
          )}
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Canais ativos</p>
            <div className="flex flex-col gap-1">
              {canais.slice(0, 4).map(c => (
                <div key={c.canal} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate">{c.canal}</span>
                  <span className={`font-semibold tabular-nums ml-2 shrink-0 ${c.taxa >= 20 ? 'text-emerald-600' : c.taxa >= 10 ? 'text-amber-600' : 'text-rose-500'}`}>
                    {c.taxa}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
