"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, Package, Award, Zap, Star, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
// Badge shadcn não é usado diretamente aqui — removido do import

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TopProduct {
  productName: string
  quantidadeVendida: number
  receitaTotal: number
  ticketMedio?: number
  lucroTotal?: number
  margemMedia?: number
}

interface Props {
  data: TopProduct[]
  showFinancial: boolean
  loading?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v)

function shortName(name: string, max = 22): string {
  return name.length > max ? name.slice(0, max) + "…" : name
}

// ─── Badges por ranking ───────────────────────────────────────────────────────

interface ProductBadge {
  label: string
  color: string
  icon: React.ElementType
}

function computeBadges(products: TopProduct[], showFinancial: boolean): Map<string, ProductBadge[]> {
  const map = new Map<string, ProductBadge[]>()
  const add = (name: string, badge: ProductBadge) => {
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push(badge)
  }

  if (products.length === 0) return map

  // Mais vendido (maior qty)
  const byQty = [...products].sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
  add(byQty[0].productName, { label: "Mais vendido", color: "bg-amber-500/15 text-amber-600 border-amber-500/25", icon: Flame })

  if (showFinancial) {
    // Maior lucro
    const byLucro = products.filter(p => p.lucroTotal != null).sort((a, b) => (b.lucroTotal ?? 0) - (a.lucroTotal ?? 0))
    if (byLucro.length > 0) add(byLucro[0].productName, { label: "Maior lucro", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25", icon: TrendingUp })

    // Maior margem
    const byMargem = products.filter(p => p.margemMedia != null).sort((a, b) => (b.margemMedia ?? 0) - (a.margemMedia ?? 0))
    if (byMargem.length > 0) add(byMargem[0].productName, { label: "Maior margem", color: "bg-purple-500/15 text-purple-600 border-purple-500/25", icon: Star })

    // Maior ticket
    const byTicket = products.filter(p => p.ticketMedio != null).sort((a, b) => (b.ticketMedio ?? 0) - (a.ticketMedio ?? 0))
    if (byTicket.length > 0) add(byTicket[0].productName, { label: "Maior ticket", color: "bg-blue-500/15 text-blue-600 border-blue-500/25", icon: Zap })
  }

  return map
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, showFinancial }: any) {
  if (!active || !payload?.length) return null
  const d: TopProduct = payload[0]?.payload
  if (!d) return null

  return (
    <div className="rounded-lg border bg-popover text-popover-foreground shadow-lg p-3 text-xs min-w-[180px]">
      <p className="font-semibold mb-2 text-sm leading-tight">{d.productName}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Vendidos</span>
          <span className="font-medium tabular-nums">{d.quantidadeVendida.toLocaleString("pt-BR")}</span>
        </div>
        {showFinancial && (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Receita</span>
              <span className="font-medium tabular-nums">{formatBRL(d.receitaTotal)}</span>
            </div>
            {d.ticketMedio != null && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Ticket médio</span>
                <span className="font-medium tabular-nums">{formatBRL(d.ticketMedio)}</span>
              </div>
            )}
            {d.lucroTotal != null && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Lucro total</span>
                <span className="font-medium tabular-nums text-emerald-600">{formatBRL(d.lucroTotal)}</span>
              </div>
            )}
            {d.margemMedia != null && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Margem</span>
                <span className="font-medium tabular-nums">{d.margemMedia.toFixed(1)}%</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="h-48 rounded bg-muted/60" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div className="h-3 w-5 rounded bg-muted" />
          <div className="flex-1 h-3 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
      <div className="rounded-full bg-muted p-4">
        <Package className="h-6 w-6 opacity-40" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Aguardando sincronização de vendas</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Os dados aparecem após importar um relatório de vendas.
        </p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProdutosMaisVendidos({ data, showFinancial, loading }: Props) {
  const badges = useMemo(() => computeBadges(data, showFinancial), [data, showFinancial])

  const chartData = data.map((d) => ({
    ...d,
    name: shortName(d.productName, 18),
  }))

  // Color ramp: first item is more saturated
  const barColors = [
    "hsl(var(--primary))",
    "hsl(221 83% 60%)",
    "hsl(221 70% 65%)",
    "hsl(221 60% 70%)",
    "hsl(221 50% 73%)",
    "hsl(221 42% 76%)",
    "hsl(221 35% 79%)",
    "hsl(221 28% 82%)",
    "hsl(221 22% 84%)",
    "hsl(221 15% 87%)",
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top {data.length} por quantidade vendida</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <Skeleton />
        ) : data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col lg:flex-row gap-0 divide-y lg:divide-y-0 lg:divide-x">
            {/* ── Gráfico ── */}
            <div className="flex-1 p-4 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                Quantidade vendida
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip showFinancial={showFinancial} />}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                  />
                  <Bar dataKey="quantidadeVendida" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={barColors[i] ?? barColors[barColors.length - 1]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Lista rankeada ── */}
            <div className="lg:w-[380px] shrink-0">
              <div className="p-4 border-b">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Ranking detalhado
                </p>
              </div>
              <div className="divide-y">
                {data.map((item, i) => {
                  const itemBadges = badges.get(item.productName) ?? []
                  return (
                    <div key={item.productName} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      {/* Rank */}
                      <div className={cn(
                        "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                        i === 0 ? "bg-amber-500 text-white" :
                        i === 1 ? "bg-zinc-400 text-white" :
                        i === 2 ? "bg-amber-700/70 text-white" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {i + 1}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-tight truncate">{item.productName}</p>

                        {/* Badges */}
                        {itemBadges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {itemBadges.map((b) => (
                              <span
                                key={b.label}
                                className={cn(
                                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium border",
                                  b.color
                                )}
                              >
                                <b.icon className="h-2.5 w-2.5" />
                                {b.label}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {item.quantidadeVendida.toLocaleString("pt-BR")} un.
                          </span>
                          {showFinancial && (
                            <>
                              <span>{formatBRL(item.receitaTotal)}</span>
                              {item.ticketMedio != null && (
                                <span>ticket {formatBRL(item.ticketMedio)}</span>
                              )}
                              {item.margemMedia != null && (
                                <span
                                  className={
                                    item.margemMedia >= 20
                                      ? "text-emerald-600 font-medium"
                                      : item.margemMedia >= 10
                                      ? "text-amber-600"
                                      : "text-red-600"
                                  }
                                >
                                  {item.margemMedia.toFixed(1)}%
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Qty bar */}
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums">{item.quantidadeVendida}</p>
                        <p className="text-[10px] text-muted-foreground">unid.</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
