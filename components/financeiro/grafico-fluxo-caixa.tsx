"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GraficoFluxoCaixaProps {
  dados: Array<{
    data: string
    entradas: number
    saidas: number
    saldo: number
  }>
}

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(valor)
}

function tooltipFormatter(
  value: number | string | readonly (number | string)[] | undefined
) {
  if (typeof value !== "number") {
    if (Array.isArray(value)) return value.join(" / ")
    return value ?? ""
  }
  return brl(value)
}

export function GraficoFluxoCaixa({ dados }: GraficoFluxoCaixaProps) {
  if (dados.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Fluxo de Caixa — Março 2026
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Realizado + projeção até fim do mês
          </p>
        </CardHeader>
        <CardContent className="h-[220px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem dados</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Fluxo de Caixa — Março 2026
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Realizado + projeção até fim do mês
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="saldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="data" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={brl} />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
            />
            <Area
              type="monotone"
              dataKey="saldo"
              name="Saldo"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#saldo)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
