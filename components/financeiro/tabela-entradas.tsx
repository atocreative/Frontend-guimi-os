"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react"

// ─── Tipo oficial do dataset reconciliado ────────────────────────────────────

export interface VendaRecente {
  id?: string | number
  cliente?: string | { nome?: string; name?: string } | null
  customer?: string | { nome?: string; name?: string } | null
  vendedor?: string | { nome?: string; name?: string } | null
  seller?: string | { nome?: string; name?: string } | null
  qtdProdutos?: number
  quantidade?: number
  qty?: number
  quantity?: number
  valorTotal?: number
  valor_total?: number
  amount?: number
  // campos de recebimento — backend reconciliado usa recebimentoLiquido
  recebimentoLiquido?: number | string
  recebimentoTotal?: number | string
  recebimento?: string
  formaPagamento?: string
  payment_method?: string
  custo?: number
  cost?: number
  cogs?: number
  lucro?: number
  lucro_bruto?: number
  profit?: number
  margem?: number
  margin?: number
  // campo de data — backend reconciliado usa dataVenda
  dataVenda?: string
  data?: string
  data_saida?: string
  createdAt?: string
  [key: string]: unknown
}

// ─── Alias para compatibilidade com o componente pai ─────────────────────────
export type SaleRow = VendaRecente

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

const PAGAMENTO_COR: Record<string, string> = {
  PIX:      "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  Crédito:  "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  Débito:   "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
  Dinheiro: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
}

// ─── Formatadores ─────────────────────────────────────────────────────────────

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(valor) ? valor : 0)
}

function pct(valor: number) {
  return `${Number.isFinite(valor) ? valor.toFixed(1) : "0.0"}%`
}

function formatData(raw: string | null | undefined): string {
  if (!raw) return "—"
  try {
    return new Date(String(raw)).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return String(raw)
  }
}

// ─── Resolvers (lê campos do backend, sem cálculo financeiro) ─────────────────

function resolveName(val: string | { nome?: string; name?: string } | null | undefined): string {
  if (!val) return "Cliente não identificado"
  if (typeof val === "string") return val.trim() || "Cliente não identificado"
  return val.nome ?? val.name ?? "Cliente não identificado"
}

function resolveVendedor(v: VendaRecente): string {
  const val = v.vendedor ?? v.seller
  if (!val) return "—"
  if (typeof val === "string") return val.trim() || "—"
  return (val as { nome?: string; name?: string }).nome ?? (val as { nome?: string; name?: string }).name ?? "—"
}

function resolveQtd(v: VendaRecente): number {
  return Number(v.qtdProdutos ?? v.quantidade ?? v.qty ?? v.quantity ?? 1)
}

function resolveValorTotal(v: VendaRecente): number {
  return Number(v.valorTotal ?? v.valor_total ?? v.amount ?? 0)
}

function resolveRecebimento(v: VendaRecente): string {
  const val = v.recebimentoLiquido ?? v.recebimento ?? v.formaPagamento ?? v.payment_method
  if (val === null || val === undefined || val === "") return "N/A"
  return String(val)
}

function resolveCusto(v: VendaRecente): number {
  return Number(v.custo ?? v.cost ?? v.cogs ?? 0)
}

function resolveLucro(v: VendaRecente): number {
  return Number(v.lucro ?? v.lucro_bruto ?? v.profit ?? 0)
}

function resolveMargem(v: VendaRecente): number {
  return Number(v.margem ?? v.margin ?? 0)
}

function resolveData(v: VendaRecente): string {
  return formatData(v.dataVenda ?? v.data ?? v.data_saida ?? v.createdAt)
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function TabelaEntradas({ entradas }: { entradas: VendaRecente[] }) {
  // ── HOOKS — sempre no topo, antes de qualquer return ─────────────────
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil((entradas?.length ?? 0) / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = useMemo(
    () => (entradas ?? []).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [entradas, currentPage],
  )

  const isEmpty = !entradas || entradas.length === 0

  if (isEmpty) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            Últimas Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <ShoppingBag className="h-8 w-8 opacity-20" />
            <p className="text-sm">Nenhuma venda no período.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            Últimas Vendas
          </CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {entradas.length} registro{entradas.length !== 1 ? "s" : ""}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold">Cliente</TableHead>
                <TableHead className="text-xs font-semibold">Vendedor</TableHead>
                <TableHead className="text-xs font-semibold text-center">Qtd</TableHead>
                <TableHead className="text-xs font-semibold text-right">Valor Total</TableHead>
                <TableHead className="text-xs font-semibold">Recebimento</TableHead>
                <TableHead className="text-xs font-semibold text-right">Custo</TableHead>
                <TableHead className="text-xs font-semibold text-right">Lucro</TableHead>
                <TableHead className="text-xs font-semibold text-center">Margem</TableHead>
                <TableHead className="text-xs font-semibold">Data</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pageItems.map((v, i) => {
                const lucro      = resolveLucro(v)
                const margem     = resolveMargem(v)
                const recebimento = resolveRecebimento(v)
                // recebimentoLiquido is a monetary value; formaPagamento is a string label
                const isMonetary  = typeof (v.recebimentoLiquido ?? v.recebimentoTotal) === "number"
                const pagCor      = PAGAMENTO_COR[recebimento] ?? "bg-muted/50 text-muted-foreground border-border"

                return (
                  <TableRow
                    key={String(v.id ?? i)}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    {/* Cliente */}
                    <TableCell className="py-1.5">
                      <span className="text-xs font-medium leading-snug">
                        {resolveName(v.cliente ?? v.customer)}
                      </span>
                    </TableCell>

                    {/* Vendedor */}
                    <TableCell className="py-1.5">
                      <span className="text-xs text-muted-foreground">
                        {resolveVendedor(v)}
                      </span>
                    </TableCell>

                    {/* Qtd */}
                    <TableCell className="py-1.5 text-center">
                      <span className="text-xs tabular-nums font-medium">
                        {resolveQtd(v)}
                      </span>
                    </TableCell>

                    {/* Valor Total — destaque */}
                    <TableCell className="py-1.5 text-right">
                      <span className="text-xs font-bold tabular-nums">
                        {brl(resolveValorTotal(v))}
                      </span>
                    </TableCell>

                    {/* Recebimento */}
                    <TableCell className="py-1.5">
                      {recebimento === "N/A" ? (
                        <span className="text-xs text-muted-foreground/50">N/A</span>
                      ) : isMonetary ? (
                        <span className="text-xs tabular-nums font-medium">
                          {brl(Number(v.recebimentoLiquido ?? v.recebimentoTotal ?? 0))}
                        </span>
                      ) : (
                        <Badge variant="outline" className={`text-xs px-1.5 py-0 font-medium ${pagCor}`}>
                          {recebimento}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Custo */}
                    <TableCell className="py-1.5 text-right">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {brl(resolveCusto(v))}
                      </span>
                    </TableCell>

                    {/* Lucro */}
                    <TableCell className="py-1.5 text-right">
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          lucro > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : lucro < 0
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {brl(lucro)}
                      </span>
                    </TableCell>

                    {/* Margem */}
                    <TableCell className="py-1.5 text-center">
                      <Badge
                        variant="secondary"
                        className={`text-xs px-1.5 py-0 tabular-nums ${
                          margem >= 20
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : margem >= 10
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                            : margem > 0
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {pct(margem)}
                      </Badge>
                    </TableCell>

                    {/* Data */}
                    <TableCell className="py-1.5">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {resolveData(v)}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-3 border-t text-xs text-muted-foreground">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 disabled:opacity-30 hover:text-foreground transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="tabular-nums font-medium text-foreground">
              {currentPage}
            </span>
            <span className="text-muted-foreground/60">/</span>
            <span className="tabular-nums">{totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 disabled:opacity-30 hover:text-foreground transition-colors"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
