"use client"

import { Smartphone, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAppleTrend } from "@/lib/queries/use-apple-trend"

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v)

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct == null) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground border-border">
        <Minus className="h-3 w-3" />
        sem comparação
      </Badge>
    )
  }
  const up = pct >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 tabular-nums font-semibold",
        up
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
      )}
    >
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </Badge>
  )
}

function LeaderRow({
  label,
  productName,
  qty,
  receita,
  loading,
}: {
  label: string
  productName: string | null
  qty: number | null
  receita?: number
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    )
  }

  return (
    <div className="space-y-1 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </p>
      <p className="text-sm font-semibold truncate" title={productName ?? ""}>
        {productName ?? "—"}
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">
        {qty != null ? `${qty.toLocaleString("pt-BR")} vendidos` : "Sem dados"}
        {receita != null && receita > 0 && (
          <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
            {formatBRL(receita)}
          </span>
        )}
      </p>
    </div>
  )
}

export function AppleTrendCard() {
  const { data, isLoading } = useAppleTrend()
  const loading = isLoading || !data
  const isEmpty = !loading && !data?.current && !data?.previous

  const monthLabel = data?.monthLabel || "Mês atual"
  const prevLabel  = data?.prevMonthLabel || "Mês anterior"

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="rounded-md bg-blue-500/10 p-1.5">
                <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </span>
              Tendência de Mercado Apple
            </CardTitle>
            <CardDescription>
              {data?.categoria
                ? `Líder ${data.categoria} · ${monthLabel} vs ${prevLabel}`
                : "Líder iPhone · atual vs anterior"}
            </CardDescription>
          </div>
          {!loading && <GrowthBadge pct={data?.growthPct ?? null} />}
        </div>
      </CardHeader>

      <CardContent>
        {isEmpty ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Sem dados de tendência Apple.
            <br />
            Sincronize vendas FoneNinja para gerar o ranking mensal.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LeaderRow
              label={`Líder · ${monthLabel}`}
              productName={data?.current?.productName ?? null}
              qty={data?.current?.quantidadeVendida ?? null}
              receita={data?.current?.receitaTotal}
              loading={loading}
            />
            <LeaderRow
              label={`Líder · ${prevLabel}`}
              productName={data?.previous?.productName ?? null}
              qty={data?.previous?.quantidadeVendida ?? null}
              receita={data?.previous?.receitaTotal}
              loading={loading}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
