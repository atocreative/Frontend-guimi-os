"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"

// ─── Shape REAL do backend /api/financeiro/compras/recentes ──────────────────

interface CompraItemBackend {
  produto?: string        // item avulso (sem itens[])
  fornecedor?: string
  totalCusto?: number
  quantidadeTotal?: number
  dataEntrada?: string
  itens?: Array<{ produto?: string; [key: string]: unknown }>
  [key: string]: unknown
}

// Alias retrocompatível para agruparDespesasPorCategoria no componente pai
export type DespesaItem  = CompraItemBackend
export type CompraItem   = CompraItemBackend

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

// ─── Formatadores ─────────────────────────────────────────────────────────────

function brl(valor: number) {
  const n = Number.isFinite(valor) ? valor : 0
  const abs = Math.abs(n)
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)
  // Compras = saída financeira → sempre exibe com sinal negativo
  return `-${formatted}`
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

// ─── Resolvers — shape exato do backend ──────────────────────────────────────

function resolveProduto(c: CompraItemBackend): string {
  const fromItens = c.itens?.[0]?.produto
  if (fromItens && String(fromItens).trim()) return String(fromItens)
  if (c.produto && String(c.produto).trim()) return String(c.produto)
  return "Não informado"
}

function resolveFornecedor(c: CompraItemBackend): string {
  return c.fornecedor && String(c.fornecedor).trim() ? String(c.fornecedor) : "Não informado"
}

function resolveQtd(c: CompraItemBackend): string {
  const n = Number(c.quantidadeTotal)
  return Number.isFinite(n) && n > 0 ? String(n) : "—"
}

function resolveValor(c: CompraItemBackend): number {
  return Number(c.totalCusto ?? 0)
}

function resolveData(c: CompraItemBackend): string {
  return formatData(c.dataEntrada)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {[70, 55, 30, 45, 40].map((w, i) => (
        <TableCell key={i} className="py-1.5">
          <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${w}%` }} />
        </TableCell>
      ))}
    </TableRow>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  despesas: CompraItemBackend[]
  loading?: boolean
}

export function TabelaDespesas({ despesas, loading = false }: Props) {
  // ── HOOKS — sempre no topo, antes de qualquer return ─────────────────
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil((despesas?.length ?? 0) / PAGE_SIZE)
  const currentPage = Math.min(page, Math.max(1, totalPages))
  const pageItems = useMemo(
    () => (despesas ?? []).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [despesas, currentPage],
  )

  const isEmpty = !loading && (!despesas || despesas.length === 0)

  if (isEmpty) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            Últimas Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <ShoppingCart className="h-8 w-8 opacity-20" />
            <p className="text-sm">Nenhuma compra encontrada.</p>
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
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            Últimas Compras
          </CardTitle>
          {!loading && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {despesas.length} registro{despesas.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold">Produto</TableHead>
                <TableHead className="text-xs font-semibold">Fornecedor</TableHead>
                <TableHead className="text-xs font-semibold text-center">Qtd</TableHead>
                <TableHead className="text-xs font-semibold text-right">Valor</TableHead>
                <TableHead className="text-xs font-semibold">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : pageItems.map((c, i) => (
                    <TableRow
                      key={String(c.id ?? i)}
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <TableCell className="py-1.5">
                        <span className="text-xs font-medium">{resolveProduto(c)}</span>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <span className="text-xs text-muted-foreground">{resolveFornecedor(c)}</span>
                      </TableCell>
                      <TableCell className="py-1.5 text-center">
                        <span className="text-xs tabular-nums text-muted-foreground">{resolveQtd(c)}</span>
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <span className="text-xs font-bold tabular-nums text-red-500">
                          {brl(resolveValor(c))}
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <span className="text-xs text-muted-foreground tabular-nums">{resolveData(c)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-3 border-t text-xs text-muted-foreground">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="disabled:opacity-30 hover:text-foreground transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="tabular-nums font-medium text-foreground">{currentPage}</span>
            <span className="text-muted-foreground/60">/</span>
            <span className="tabular-nums">{totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="disabled:opacity-30 hover:text-foreground transition-colors"
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
