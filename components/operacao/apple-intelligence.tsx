"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, Percent, DollarSign, Layers, Package, Palette, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppleProduct {
  titulo: string
  estoque: number
  cor?: string | null
  capacidade?: string | null
  precoVenda?: number
  lucro?: number
  valorEstoque?: number
  margem?: number | null
}

interface AppleSaleItem {
  productName: string
  quantidadeVendida: number
  receitaTotal: number
}

export interface AppleInsights {
  totalProdutosApple: number
  totalEstoqueApple: number
  capacidadeMaisComum?: string | null
  corMaisComum?: string | null
  top10Inventario: AppleProduct[]
  topVendidos: AppleSaleItem[]
  valorTotalEstoqueApple?: number
  ticketMedioApple?: number
  margemMediaApple?: number
}

interface Props {
  data: AppleInsights | null
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

// ─── Mini stat card ───────────────────────────────────────────────────────────

function MiniStat({
  icon: Icon,
  label,
  value,
  color = "text-muted-foreground",
  bg = "bg-muted",
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  color?: string
  bg?: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
      <div className={cn("rounded-lg p-2 shrink-0", bg)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="h-3 w-5 rounded bg-muted" />
            <div className="flex-1 h-3 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
      <div className="rounded-full bg-muted p-4">
        <Package className="h-6 w-6 opacity-40" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Aguardando sincronização</p>
        <p className="text-xs mt-1 max-w-xs leading-relaxed">
          Os insights Apple aparecem após sincronizar o inventário.
          <br />
          Produtos iPhone, iPad, MacBook e AirPods são detectados automaticamente.
        </p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AppleIntelligence({ data, showFinancial, loading }: Props) {
  // data null = sync ainda não rodou; totalProdutosApple === 0 = sem produtos Apple no estoque
  const isEmpty = !loading && (!data || data.totalProdutosApple === 0)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Apple Intelligence</CardTitle>
        <CardDescription>Análise do portfólio Apple no inventário</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <Skeleton />
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <div className="p-4 space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniStat
                icon={Layers}
                label="Produtos Apple"
                value={data!.totalProdutosApple.toLocaleString("pt-BR")}
                bg="bg-zinc-500/10"
                color="text-zinc-500"
              />
              <MiniStat
                icon={Package}
                label="Em estoque"
                value={data!.totalEstoqueApple.toLocaleString("pt-BR")}
                bg="bg-blue-500/10"
                color="text-blue-500"
              />
              {data?.capacidadeMaisComum && (
                <MiniStat
                  icon={HardDrive}
                  label="Capacidade top"
                  value={data.capacidadeMaisComum}
                  bg="bg-purple-500/10"
                  color="text-purple-500"
                />
              )}
              {data?.corMaisComum && (
                <MiniStat
                  icon={Palette}
                  label="Cor mais comum"
                  value={data.corMaisComum}
                  bg="bg-rose-500/10"
                  color="text-rose-500"
                />
              )}
            </div>

            {/* Financial KPIs — financial only */}
            {showFinancial && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data?.valorTotalEstoqueApple != null && (
                  <MiniStat
                    icon={DollarSign}
                    label="Valor total Apple"
                    value={formatBRL(data.valorTotalEstoqueApple)}
                    bg="bg-emerald-500/10"
                    color="text-emerald-500"
                  />
                )}
                {data?.ticketMedioApple != null && (
                  <MiniStat
                    icon={TrendingUp}
                    label="Ticket médio Apple"
                    value={formatBRL(data.ticketMedioApple)}
                    bg="bg-amber-500/10"
                    color="text-amber-500"
                  />
                )}
                {data?.margemMediaApple != null && (
                  <MiniStat
                    icon={Percent}
                    label="Margem média Apple"
                    value={`${data.margemMediaApple.toFixed(1)}%`}
                    bg="bg-rose-500/10"
                    color="text-rose-500"
                  />
                )}
              </div>
            )}

            {/* Split: inventário + vendas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top inventário */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Top estoque
                </p>
                <div className="space-y-1">
                  {data!.top10Inventario.slice(0, 8).map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0 text-right">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-tight truncate">{p.titulo}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {[p.capacidade, p.cor].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold tabular-nums">{p.estoque}</p>
                        <p className="text-[10px] text-muted-foreground">un.</p>
                      </div>
                      {showFinancial && p.margem != null && (
                        <span
                          className={cn(
                            "text-[10px] font-medium tabular-nums w-10 text-right shrink-0",
                            p.margem >= 20
                              ? "text-emerald-600"
                              : p.margem >= 10
                              ? "text-amber-600"
                              : "text-red-600"
                          )}
                        >
                          {p.margem.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Top vendidos Apple */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Mais vendidos Apple
                </p>
                {data!.topVendidos.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-4 text-center">
                    Sem dados de vendas Apple ainda.
                    <br />
                    <span className="text-[10px]">Importe relatório de vendas para ver os dados.</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {data!.topVendidos.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors"
                      >
                        <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0 text-right">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-tight truncate">{p.productName}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold tabular-nums">{p.quantidadeVendida.toLocaleString("pt-BR")}</p>
                          <p className="text-[10px] text-muted-foreground">vendidos</p>
                        </div>
                        {showFinancial && (
                          <div className="shrink-0 text-right w-16">
                            <p className="text-[10px] text-emerald-600 font-medium tabular-nums">
                              {formatBRL(p.receitaTotal)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
