"use client"

import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v)

interface InsightsPeriodoProps {
  mes: number
  ano: number
  lucroBrutoMes: number
  lucroLiquidoReal: number | null
  margemReal: number
  prevLucroBruto: number | null
  loading: boolean
  tendencia: "up" | "down" | "neutral"
  alertasCriticos: number
  alertasAvisos: number
  // dados extras para insights narrativos
  faturamento?: number
  prevFaturamento?: number
  ticketMedio?: number
  prevTicketMedio?: number
  soldProducts?: number
  produtoCampeao?: string
  melhorVendedor?: string
  diaAtual?: number
  totalDiasNoMes?: number
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
  alertasCriticos,
  alertasAvisos,
  faturamento,
  prevFaturamento,
  ticketMedio,
  prevTicketMedio,
  soldProducts,
  produtoCampeao,
  melhorVendedor,
  diaAtual,
  totalDiasNoMes,
}: InsightsPeriodoProps) {
  if (loading) return null

  const prevMes = mes === 0 ? 11 : mes - 1

  const variacaoLucro =
    prevLucroBruto != null && prevLucroBruto > 0 && lucroBrutoMes > 0
      ? ((lucroBrutoMes - prevLucroBruto) / prevLucroBruto) * 100
      : null

  const variacaoFat =
    prevFaturamento && prevFaturamento > 0 && faturamento && faturamento > 0
      ? ((faturamento - prevFaturamento) / prevFaturamento) * 100
      : null

  const variacaoTicket =
    prevTicketMedio && prevTicketMedio > 0 && ticketMedio && ticketMedio > 0
      ? ((ticketMedio - prevTicketMedio) / prevTicketMedio) * 100
      : null

  const projecao =
    faturamento && diaAtual && totalDiasNoMes && diaAtual > 0
      ? Math.round((faturamento / diaAtual) * totalDiasNoMes)
      : null

  type InsightItem = { icon: typeof TrendingUp; color: string; text: string }
  const insights: InsightItem[] = []

  // 1. Tendência de faturamento
  if (variacaoFat !== null) {
    if (variacaoFat >= 0) {
      insights.push({ icon: TrendingUp, color: "text-emerald-500", text: `Faturamento +${variacaoFat.toFixed(1)}% vs ${MESES[prevMes]}` })
    } else {
      insights.push({ icon: TrendingDown, color: "text-rose-500", text: `Faturamento caiu ${Math.abs(variacaoFat).toFixed(1)}% vs ${MESES[prevMes]}` })
    }
  } else if (tendencia === "up") {
    insights.push({ icon: TrendingUp, color: "text-emerald-500", text: "Receita em crescimento no período" })
  } else if (tendencia === "down") {
    insights.push({ icon: TrendingDown, color: "text-rose-500", text: "Receita em queda — revisar mix de produtos" })
  }

  // 2. Ticket médio
  if (variacaoTicket !== null) {
    if (variacaoTicket >= 3) {
      insights.push({ icon: TrendingUp, color: "text-emerald-500", text: `Ticket médio subiu ${variacaoTicket.toFixed(1)}%: ${formatBRL(ticketMedio!)}` })
    } else if (variacaoTicket <= -5) {
      insights.push({ icon: TrendingDown, color: "text-amber-500", text: `Ticket médio caiu ${Math.abs(variacaoTicket).toFixed(1)}%: ${formatBRL(ticketMedio!)}` })
    }
  }

  // 3. Margem
  if (margemReal > 0) {
    const margemClass = margemReal >= 10 ? "text-emerald-500" : margemReal >= 5 ? "text-amber-500" : "text-rose-500"
    const margemMsg = margemReal >= 10 ? "Margem saudável" : margemReal >= 5 ? "Margem dentro do aceitável" : "Margem abaixo do ideal"
    insights.push({ icon: margemReal >= 5 ? TrendingUp : TrendingDown, color: margemClass, text: `${margemMsg}: ${margemReal.toFixed(1)}%` })
  }

  // 4. Produto campeão
  if (produtoCampeao) {
    insights.push({ icon: TrendingUp, color: "text-blue-500", text: `Produto campeão: ${produtoCampeao}` })
  }

  // 5. Meta de produtos
  if (soldProducts != null && soldProducts > 0) {
    const META = 300
    const pct = Math.round((soldProducts / META) * 100)
    if (pct >= 100) {
      insights.push({ icon: TrendingUp, color: "text-emerald-500", text: `Meta de produtos atingida: ${soldProducts} / ${META} (${pct}%)` })
    } else if (pct >= 70) {
      insights.push({ icon: Minus, color: "text-amber-500", text: `${soldProducts} de ${META} produtos vendidos (${pct}% da meta)` })
    } else {
      insights.push({ icon: TrendingDown, color: "text-rose-500", text: `Abaixo da meta: ${soldProducts} / ${META} produtos (${pct}%)` })
    }
  }

  // 6. Projeção de fechamento
  if (projecao !== null && faturamento) {
    const diffPct = prevFaturamento ? ((projecao - prevFaturamento) / prevFaturamento) * 100 : null
    const sinal = diffPct !== null ? (diffPct >= 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`) : ""
    insights.push({ icon: Minus, color: "text-zinc-400", text: `Projeção para ${MESES[mes]}: ${formatBRL(projecao)}${sinal ? ` (${sinal} vs ${MESES[prevMes]})` : ""}` })
  }

  // 7. Melhor vendedor
  if (melhorVendedor) {
    insights.push({ icon: TrendingUp, color: "text-purple-500", text: `Melhor vendedor: ${melhorVendedor}` })
  }

  // 8. Alertas
  const hasAlerts = alertasCriticos > 0 || alertasAvisos > 0

  const TrendIcon =
    tendencia === "up" ? TrendingUp : tendencia === "down" ? TrendingDown : Minus
  const trendColor =
    tendencia === "up" ? "text-emerald-500" : tendencia === "down" ? "text-rose-500" : "text-zinc-400"
  const trendLabel =
    tendencia === "up" ? "Crescimento" : tendencia === "down" ? "Queda" : "Estável"

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Inteligência Operacional
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

        {insights.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {insights.slice(0, 6).map((ins, i) => {
              const Icon = ins.icon
              return (
                <div key={i} className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                  <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", ins.color)} />
                  <span className="text-xs leading-snug text-foreground/80">{ins.text}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2">
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Lucro Bruto</p>
              <p className="text-sm font-semibold tabular-nums">{lucroBrutoMes > 0 ? formatBRL(lucroBrutoMes) : "—"}</p>
              {variacaoLucro != null && (
                <p className={cn("text-xs tabular-nums mt-0.5", variacaoLucro >= 0 ? "text-emerald-600" : "text-rose-500")}>
                  {variacaoLucro >= 0 ? "+" : ""}{variacaoLucro.toFixed(1)}% vs {MESES[prevMes]}
                </p>
              )}
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Lucro Líquido Real</p>
              <p className={cn("text-sm font-semibold tabular-nums", lucroLiquidoReal != null && lucroLiquidoReal < 0 && "text-rose-500")}>
                {lucroLiquidoReal != null ? formatBRL(lucroLiquidoReal) : "—"}
              </p>
              {margemReal > 0 && <p className="text-xs text-muted-foreground mt-0.5">{margemReal.toFixed(1)}% de margem</p>}
            </div>
          </div>
        )}

        {hasAlerts && (
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {alertasCriticos > 0 && (
              <span className="flex items-center gap-1 text-rose-600 font-medium">
                <AlertTriangle className="h-3 w-3" />{alertasCriticos} crítico{alertasCriticos > 1 ? "s" : ""}
              </span>
            )}
            {alertasAvisos > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <AlertTriangle className="h-3 w-3" />{alertasAvisos} aviso{alertasAvisos > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
