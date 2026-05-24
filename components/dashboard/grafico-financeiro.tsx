"use client"

import { useMemo } from "react"
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface GraficoDia {
  mes?: string
  dia?: string
  faturamento: number
  lucro: number
  despesas?: number
}

interface GraficoFinanceiroProps {
  dados: GraficoDia[]
  titulo?: string
}

// ── constantes ─────────────────────────────────────────────────────────────────

const DAY_WIDTH_PX = 44   // pixels per day column
const MIN_WIDTH_PX = 480
const CHART_HEIGHT  = 240

const WEEKDAYS = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"]

// ── helpers ────────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatBRLFull(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function smartMax(values: number[]): number {
  const max = Math.max(...values, 0)
  if (max === 0) return 10_000
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  for (const s of steps) {
    const candidate = Math.ceil(max / (magnitude * s)) * magnitude * s
    if (candidate >= max * 1.15) return candidate
  }
  return Math.ceil(max * 1.2)
}

// "YYYY-MM-DD" → "DD/MM"
function toShortLabel(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [, m, d] = raw.split("-")
    return `${d}/${m}`
  }
  return raw
}

// "YYYY-MM-DD" → "Sexta-feira, 23/05/2025"
function toFullLabel(raw: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const [y, m, d] = raw.split("-").map(Number)
  const date = new Date(y, m - 1, d)  // local time — avoids UTC day-shift
  return `${WEEKDAYS[date.getDay()]}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`
}

// today's date string "YYYY-MM-DD" in local time
function todayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// ── custom tooltip ──────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  const faturamento: number = point.faturamento ?? 0
  const lucro: number = point.lucro ?? 0
  const despesas: number = point.despesas ?? 0

  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-lg text-xs min-w-[180px]">
      <p className="mb-2 font-semibold text-foreground leading-tight">{point.fullLabel}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            Lucro
          </span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatBRLFull(lucro)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-blue-400" />
            Faturamento
          </span>
          <span className="font-medium tabular-nums">{formatBRLFull(faturamento)}</span>
        </div>
        {despesas > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-400" />
              Despesas
            </span>
            <span className="font-medium tabular-nums text-red-500">{formatBRLFull(despesas)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── componente ─────────────────────────────────────────────────────────────────

export function GraficoFinanceiro({ dados, titulo }: GraficoFinanceiroProps) {
  const today = useMemo(() => todayString(), [])

  const chartData = useMemo(() => {
    if (!dados?.length) return []
    return dados
      .filter((item) => {
        // Keep only days up to and including today
        const raw = item.dia ?? item.mes ?? ""
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw <= today
        return true  // non-ISO labels always kept
      })
      .map((item) => {
        const raw = item.dia ?? item.mes ?? ""
        return {
          raw,
          label: toShortLabel(raw),
          fullLabel: toFullLabel(raw),
          faturamento: item.faturamento,
          lucro: item.lucro,
          despesas: item.despesas ?? 0,
        }
      })
  }, [dados, today])

  const { yMax, chartWidth } = useMemo(() => {
    const allValues = chartData.flatMap((d) => [d.faturamento, d.lucro])
    return {
      yMax: smartMax(allValues),
      chartWidth: Math.max(MIN_WIDTH_PX, chartData.length * DAY_WIDTH_PX),
    }
  }, [chartData])

  if (!chartData.length) return null

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-semibold">
          {titulo ?? "Lucro Médio Diário"}
        </CardTitle>
        <CardDescription className="text-[11px]">
          Baseado em vendas reconciliadas · até hoje
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4 pl-1 pr-2">
        {/* Scroll wrapper — allows swipe on mobile, drag on desktop */}
        <div className="overflow-x-auto">
          <div style={{ width: chartWidth, height: CHART_HEIGHT }}>
            <ComposedChart
              width={chartWidth}
              height={CHART_HEIGHT}
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="currentColor"
                strokeOpacity={0.07}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.55 }}
                tickLine={false}
                axisLine={false}
                interval={0}
              />

              <YAxis
                domain={[0, yMax]}
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.55 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatBRL}
                width={60}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "currentColor", fillOpacity: 0.04 }}
              />

              {/* Faturamento — barra discreta de fundo */}
              <Bar
                dataKey="faturamento"
                name="Faturamento"
                fill="#3b82f6"
                fillOpacity={0.12}
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />

              {/* Lucro — área principal em destaque */}
              <Area
                type="monotone"
                dataKey="lucro"
                name="Lucro"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#gradLucro)"
                dot={{ r: 2.5, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
