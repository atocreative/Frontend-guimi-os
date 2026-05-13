'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import type { Lead } from '@/app/(dashboard)/comercial/data/mock'

interface GraficoOrigemProps {
  leads: Lead[]
}

const COLORS = ['#0f42f2', '#ff6b6b', '#ffd43b', '#51cf66', '#748ffc', '#ff922b', '#a78bfa', '#f472b6']

export function GraficoOrigem({ leads }: GraficoOrigemProps) {
  // Agrupa por origem
  const origem = leads.reduce(
    (acc, lead) => {
      const existing = acc.find((o) => o.name === lead.origem)
      if (existing) {
        existing.value += 1
      } else {
        acc.push({ name: lead.origem, value: 1 })
      }
      return acc
    },
    [] as Array<{ name: string; value: number }>
  )

  if (origem.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        Sem dados de origem
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={origem}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value, percent }) => `${name} (${value})`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {origem.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value} lead(s)`} />
      </PieChart>
    </ResponsiveContainer>
  )
}
