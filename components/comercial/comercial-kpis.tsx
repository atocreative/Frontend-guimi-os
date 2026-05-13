'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react'
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

  const kpis = [
    {
      label: 'Leads Ativos',
      value: leadsAtivos.length,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Leads Ganhos',
      value: leadsGanhos.length,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Leads Perdidos',
      value: leadsPerdidos.length,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Taxa Conversão',
      value: `${taxaConversao}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Tempo Médio Resposta',
      value: `${tempoMedioResposta}d`,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className={`rounded-lg ${kpi.bg} p-2.5 mb-2 w-fit`}>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
