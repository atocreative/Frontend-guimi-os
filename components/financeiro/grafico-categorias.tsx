"use client"

import * as React from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const CORES = ["#a855f7", "#ef4444", "#f97316", "#3b82f6", "#10b981"]

interface GraficoCategoriaProps {
  dados: Array<{
    categoria: string
    valor: number
    percentual: number
  }>
}

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
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

export function GraficoCategorias({ dados }: GraficoCategoriaProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <div className="h-full w-full animate-pulse rounded-lg bg-muted/50" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Despesas por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <Pie
              data={dados}
              dataKey="valor"
              nameKey="categoria"
              cx="50%"
              cy="50%"
              outerRadius={75}
              label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
              labelLine
            >
              {dados.map((_, index) => (
                <Cell key={index} fill={CORES[index % CORES.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
