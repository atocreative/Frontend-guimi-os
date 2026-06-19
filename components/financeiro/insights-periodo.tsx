"use client"

import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function formatBRL(valor: number) {
  const n = Number.isFinite(valor) ? valor : 0
  const abs = Math.abs(n)
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)
  return n < 0 ? `-${formatted}` : formatted
}

interface InsightsPeriodoProps {
  mes: number
  ano: number
  lucroBrutoMes: number
  lucroLiquidoReal: number | null
  margemReal: number
  prevLucroBruto: number | null
  loading?: boolean
  tendencia: "up" | "down" | "neutral"
  alertasCriticos?: number
  alertasAvisos?: number
}

export function InsightsPeriodo({
  mes,
  ano,
  lucroBrutoMes,
  lucroLiquidoReal,
  margemReal,
  prevLucroBruto,
  loading,
  tendencia,
  alertasCriticos = 0,
  alertasAvisos = 0,
}: InsightsPeriodoProps) {
  if (loading) return null

  const variacaoPct =
    prevLucroBruto != null && prevLucroBruto > 0 && lucroBrutoMes > 0
      ? ((lucroBrutoMes - prevLucroBruto) / prevLucroBruto) * 100
      : null

  const prevMes = mes === 0 ? 11 : mes - 1

  const TrendIcon =
    tendencia === "up" ? TrendingUp : tendencia === "down" ? TrendingDown : Minus

  const trendColor =
    tendencia === "up"
      ? "text-emerald-500"
      : tendencia === "down"
      ? "text-rose-500"
      : "text-zinc-400"

  const trendLabel =
    tendencia === "up" ? "Crescimento" : tendencia === "down" ? "Queda" : "Estável"

  const hasAlerts = alertasCriticos > 0 || alertasAvisos > 0

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Insights do Período
            </p>
            <p className="text-sm font-semibold mt-0.5">
              {MESES[mes]} {ano}
            </p>
          </div>
          <div className={cn("flex items-center gap-1.5 shrink-0", trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{trendLabel}</span>
          </div>
        </div>

        <div className={cn("grid gap-3", hasAlerts ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
          {/* Lucro Bruto */}
          <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Lucro Bruto</p>
            <p className="text-sm font-semibold tabular-nums">
              {lucroBrutoMes > 0 ? formatBRL(lucroBrutoMes) : "—"}
            </p>
            {variacaoPct != null && (
              <p
                className={cn(
                  "text-xs tabular-nums mt-0.5",
                  variacaoPct >= 0 ? "text-emerald-600" : "text-rose-500"
                )}
              >
                {variacaoPct >= 0 ? "+" : ""}
                {variacaoPct.toFixed(1)}% vs {MESES[prevMes]}
              </p>
            )}
          </div>

          {/* Lucro Líquido Real */}
          <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Lucro Líquido Real</p>
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                lucroLiquidoReal != null && lucroLiquidoReal < 0 && "text-rose-500"
              )}
            >
              {lucroLiquidoReal != null ? formatBRL(lucroLiquidoReal) : "—"}
            </p>
            {margemReal > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {margemReal.toFixed(1)}% de margem
              </p>
            )}
          </div>

          {/* Alertas */}
          {hasAlerts && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-1">Alertas</p>
              <div className="flex flex-col gap-0.5">
                {alertasCriticos > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-rose-600">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {alertasCriticos} crítico{alertasCriticos > 1 ? "s" : ""}
                  </span>
                )}
                {alertasAvisos > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {alertasAvisos} aviso{alertasAvisos > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
