"use client"

import { Archive, DollarSign, Package, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOperacaoInventory } from "@/lib/queries/use-operacao-inventory"
import { useMostSoldItems } from "@/lib/queries/use-most-sold-items"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EM_BREVE = "Em breve"

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v)

function safeNum(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v) || v === 0) return null
  return v
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ElementType
  label: string
  value: string
  loading: boolean
}) {
  const unavailable = value === EM_BREVE
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-32 rounded" />
        ) : (
          <p className={`text-2xl font-bold tabular-nums ${unavailable ? "text-muted-foreground/50 text-base" : ""}`}>
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── List Card ────────────────────────────────────────────────────────────────

function ListCard({
  title,
  loading,
  empty,
  children,
}: {
  title: string
  loading: boolean
  empty: boolean
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full rounded" />
            ))}
          </div>
        ) : empty ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground/50">
            {EM_BREVE}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  showFinancial: boolean
}

export function OperacaoCards({ showFinancial }: Props) {
  const inventory = useOperacaoInventory()
  const mostSold  = useMostSoldItems()

  const invLoading  = inventory.isLoading && !inventory.data
  const soldLoading = mostSold.isLoading && !mostSold.data

  const inv  = inventory.data
  const sold = mostSold.data?.data

  // KPI values — null means "Em breve"
  const valorEstoque   = showFinancial ? safeNum(inv?.valorTotalEstoque) : null
  const qtdItens       = safeNum(inv?.totalItens)

  const kpiValor = showFinancial
    ? (invLoading ? "…" : valorEstoque !== null ? formatBRL(valorEstoque) : EM_BREVE)
    : null

  const kpiQtd = invLoading
    ? "…"
    : qtdItens !== null
    ? qtdItens.toLocaleString("pt-BR")
    : EM_BREVE

  const topSoldEmpty   = !soldLoading && (!sold || sold.length === 0)
  const topValueEmpty  = !invLoading && (!inv?.topPorValor || inv.topPorValor.length === 0)

  return (
    <div className="space-y-4">
      {/* Row 1: KPI cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <KpiCard
          icon={Archive}
          label="Quantidade em Estoque"
          value={kpiQtd}
          loading={invLoading}
        />
        {showFinancial && kpiValor !== null && (
          <KpiCard
            icon={DollarSign}
            label="Valor em Estoque"
            value={kpiValor}
            loading={invLoading}
          />
        )}
      </div>

      {/* Row 2: Top 10 produtos + Produtos com maior valor */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Top 10 mais vendidos */}
        <ListCard
          title="Top 10 Produtos Mais Vendidos"
          loading={soldLoading}
          empty={topSoldEmpty}
        >
          <div className="divide-y">
            {sold?.map((item, i) => (
              <div key={item.productName} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.productName}</p>
                  {showFinancial && item.receitaTotal !== null && (
                    <p className="text-[11px] text-muted-foreground">
                      {formatBRL(item.receitaTotal)}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums">{item.quantidadeVendida}</p>
                  <p className="text-[10px] text-muted-foreground">un.</p>
                </div>
              </div>
            ))}
          </div>
        </ListCard>

        {/* Produtos com maior valor em estoque */}
        <ListCard
          title="Produtos com Maior Valor em Estoque"
          loading={invLoading}
          empty={topValueEmpty}
        >
          <div className="divide-y">
            {inv?.topPorValor?.map((item, i) => {
              const valor = item.valorEstoque !== null && item.valorEstoque > 0 ? item.valorEstoque : null
              return (
                <div key={`${item.titulo}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.titulo}</p>
                    {item.estoque !== null && (
                      <p className="text-[11px] text-muted-foreground">
                        {item.estoque.toLocaleString("pt-BR")} un. em estoque
                      </p>
                    )}
                  </div>
                  {showFinancial && (
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold tabular-nums text-emerald-600">
                        {valor !== null ? formatBRL(valor) : EM_BREVE}
                      </p>
                    </div>
                  )}
                  {!showFinancial && (
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </ListCard>
      </div>
    </div>
  )
}
