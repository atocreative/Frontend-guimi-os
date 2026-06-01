"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Package } from "lucide-react"
import { cn } from "@/lib/utils"

const SCROLL_THRESHOLD = 4
const ROW_HEIGHT_PX = 52      // altura aproximada de cada item (py-2 + 2 linhas de texto)
const FIXED_LIST_PX  = ROW_HEIGHT_PX * SCROLL_THRESHOLD  // ≈ 208 px

interface AppleSaleItem {
  productName: string
  quantidadeVendida: number
  receitaTotal: number
}

export interface AppleInsights {
  totalProdutosApple: number
  totalEstoqueApple: number
  topVendidos: AppleSaleItem[]
  // Campos legados — ignorados pela UI atual mas mantidos no tipo para compatibilidade do endpoint
  top10Inventario?: any[]
  capacidadeMaisComum?: string | null
  corMaisComum?: string | null
  valorTotalEstoqueApple?: number
  ticketMedioApple?: number
  margemMediaApple?: number
}

interface Props {
  data: AppleInsights | null
  showFinancial: boolean
  loading?: boolean
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v)

function Skeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      {Array.from({ length: 2 }).map((_, c) => (
        <div key={c} className="space-y-2">
          <div className="h-3 w-1/3 rounded bg-muted" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="h-3 w-5 rounded bg-muted" />
              <div className="flex-1 h-3 rounded bg-muted" />
              <div className="h-3 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
      <div className="rounded-full bg-muted p-4">
        <Package className="h-6 w-6 opacity-40" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Sem dados Apple</p>
        <p className="text-xs mt-1 max-w-xs leading-relaxed">
          Sincronize o inventário e importe vendas para ver Mais/Menos vendidos.
        </p>
      </div>
    </div>
  )
}

function RankedList({
  title,
  items,
  showFinancial,
  emptyLabel,
}: {
  title: string
  items: AppleSaleItem[]
  showFinancial: boolean
  emptyLabel: string
}) {
  const needsScroll = items.length > SCROLL_THRESHOLD

  const rows = (
    <div className="space-y-1 pr-1">
      {items.map((p, i) => (
        <div
          key={`${p.productName}-${i}`}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors"
        >
          <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0 text-right">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium leading-tight truncate">{p.productName}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-bold tabular-nums">
              {p.quantidadeVendida.toLocaleString("pt-BR")}
            </p>
            <p className="text-[10px] text-muted-foreground">vendidos</p>
          </div>
          {showFinancial && (
            <div className="shrink-0 text-right w-20">
              <p className={cn("text-[11px] font-semibold tabular-nums text-emerald-600")}>
                {formatBRL(p.receitaTotal)}
              </p>
              <p className="text-[10px] text-muted-foreground">faturamento</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </p>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground py-4 text-center">{emptyLabel}</div>
      ) : needsScroll ? (
        <ScrollArea
          className="rounded-md border border-border/40"
          style={{ height: FIXED_LIST_PX }}
        >
          <div className="p-1">{rows}</div>
        </ScrollArea>
      ) : (
        rows
      )}
    </div>
  )
}

export function ApplePerformance({ data, showFinancial, loading }: Props) {
  const vendas = data?.topVendidos ?? []
  const isEmpty = !loading && vendas.length === 0

  // Mais vendidos: maior qty primeiro. Menos vendidos: menor qty primeiro.
  // Lista completa — ScrollArea cuida da altura quando > SCROLL_THRESHOLD.
  const sortedDesc = [...vendas].sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
  const sortedAsc = [...vendas].sort((a, b) => a.quantidadeVendida - b.quantidadeVendida)

  const mais = sortedDesc
  const menos = vendas.length > SCROLL_THRESHOLD
    ? sortedAsc
    : sortedAsc.slice(Math.floor(vendas.length / 2))

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Apple Performance</CardTitle>
        <CardDescription>Mais e menos vendidos do portfólio Apple</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <Skeleton />
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
            <RankedList
              title="Mais vendidos Apple"
              items={mais}
              showFinancial={showFinancial}
              emptyLabel="Sem vendas Apple."
            />
            <RankedList
              title="Menos vendidos Apple"
              items={menos}
              showFinancial={showFinancial}
              emptyLabel="Dados insuficientes."
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Alias retrocompatível — evita quebrar imports legados durante a transição.
export const AppleIntelligence = ApplePerformance
