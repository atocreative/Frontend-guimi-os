"use client"

import * as React from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GraficoEvolucaoProps {
  dados: Array<{
    mes: string
    lucro: number
  }>
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

function tooltipFormatter(
  value: number | string | readonly (number | string)[] | undefined,
  name: string | number | undefined
) {
  const label = name === undefined ? "" : String(name)

  if (typeof value !== "number") {
    if (Array.isArray(value)) return [value.join(" / "), label] as [string, string]
    return [String(value ?? ""), label] as [string, string]
  }

  if (label === "Lucro") {
    return [formatCurrency(value), label] as [string, string]
  }

  return [formatCurrency(value), label] as [string, string]
}

export function GraficoEvolucao({ dados }: GraficoEvolucaoProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Lucro Médio por Mês
          </CardTitle>
          <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
        </CardHeader>
        <CardContent className="h-[220px] flex items-center justify-center">
           <div className="h-full w-full animate-pulse rounded-lg bg-muted/50" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Lucro Médio por Mês
        </CardTitle>
        <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="lucro"
              orientation="left"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(value)
              }
            />
            <Tooltip
              contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
              formatter={tooltipFormatter}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Line
              yAxisId="lucro"
              type="monotone"
              dataKey="lucro"
              name="Lucro"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
