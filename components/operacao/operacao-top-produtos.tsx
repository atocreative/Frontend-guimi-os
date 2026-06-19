"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Package } from "lucide-react"
import { useOperationDashboard } from "@/lib/queries/use-operation-dashboard"
import type { MostSoldItemFN } from "@/app/api/operation/dashboard/route"

// ── Client-side category filter (fallback while backend may not support topFilter)
const DEVICE_KEYWORDS = ["IPHONE", "SAMSUNG", "XIAOMI", "MOTOROLA", "MACBOOK", "IPAD", "WATCH", "AIRPOD", "NOTEBOOK", "TABLET"]
const ACCESSORY_KEYWORDS = ["CAPA", "PELÍCULA", "PELICULA", "FONTE", "CABO", "CARREGADOR", "SUPORTE", "CAPINHA", "PELÍCULA", "FONE", "PROTETOR"]

function guessCategory(name: string): "device" | "accessory" | "other" {
  const upper = name.toUpperCase()
  if (DEVICE_KEYWORDS.some((k) => upper.includes(k))) return "device"
  if (ACCESSORY_KEYWORDS.some((k) => upper.includes(k))) return "accessory"
  return "other"
}

function filterItems(items: MostSoldItemFN[], filter: string): MostSoldItemFN[] {
  if (filter === "all") return items
  return items.filter((item) => {
    const cat = item.category?.toUpperCase()
    if (filter === "devices") {
      return cat
        ? cat.includes("APARELHO") || cat.includes("DEVICE")
        : guessCategory(item.productName) === "device"
    }
    if (filter === "accessories") {
      return cat
        ? cat.includes("ACESSORIO") || cat.includes("ACESSÓRIO") || cat.includes("ACCESSORY")
        : guessCategory(item.productName) === "accessory"
    }
    return true
  })
}

const FILTERS = [
  { id: "all",         label: "Todos" },
  { id: "devices",     label: "Aparelhos" },
  { id: "accessories", label: "Acessórios" },
]

interface Props {
  showFinancial?: boolean
}

export function OperacaoTopProdutos({ showFinancial: _showFinancial }: Props) {
  const now = new Date()
  const [activeFilter, setActiveFilter] = useState("all")

  const { data, isLoading } = useOperationDashboard(now.getMonth() + 1, now.getFullYear())

  const loading = isLoading && !data
  const allItems = data?.mostSoldItems ?? []
  const filtered = filterItems(allItems, activeFilter).slice(0, 10)

  const chartData = filtered.slice(0, 8).map((d) => ({
    name: d.productName.length > 18 ? d.productName.slice(0, 16) + "…" : d.productName,
    value: d.quantitySold,
  }))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold">Top 10 Produtos</CardTitle>
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeFilter === f.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:border-border"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
            <div className="rounded-full bg-muted p-4">
              <Package className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm">Nenhum item encontrado com os critérios atuais.</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x">
            {/* Lista rankeada — 35% width */}
            <div className="lg:w-[35%] shrink-0 divide-y">
              {filtered.map((item, i) => (
                <div
                  key={`${item.productName}-${i}`}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <span
                    className={`text-xs font-bold w-5 shrink-0 tabular-nums ${
                      i === 0
                        ? "text-amber-500"
                        : i === 1
                        ? "text-zinc-400"
                        : i === 2
                        ? "text-amber-700/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.productName}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums">
                      {item.quantitySold.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">un.</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfico — 65% width */}
            {chartData.length > 0 && (
              <div className="flex-1 p-4 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Quantidade vendida
                </p>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(200, chartData.length * 28)}
                >
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                    barCategoryGap="28%"
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={20}>
                      {chartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={`hsl(221 ${Math.max(20, 83 - i * 7)}% ${Math.min(82, 58 + i * 4)}%)`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
