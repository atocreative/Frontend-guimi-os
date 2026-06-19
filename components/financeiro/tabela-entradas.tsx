"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, ShoppingBag, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  // status da venda
  status?: string | null
  statusLabel?: string | null
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

const STATUS_NORM: Record<string, { label: string; cls: string }> = {
  concluida:  { label: "Concluída", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  completed:  { label: "Concluída", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  pendente:   { label: "Pendente",  cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  pending:    { label: "Pendente",  cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
}

function resolveStatus(v: VendaRecente): { label: string; cls: string } | null {
  const raw = (v.statusLabel ?? v.status ?? "").toLowerCase().trim()
  if (!raw) return null
  return STATUS_NORM[raw] ?? { label: v.statusLabel ?? v.status ?? raw, cls: "bg-muted/50 text-muted-foreground border-border" }
}

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
  const [filtroCliente, setFiltroCliente] = useState("")
  const [filtroStatus, setFiltroStatus]   = useState("todos")
  const [filtroVendedor, setFiltroVendedor] = useState("todos")

  // Vendedores únicos para o select
  const vendedores = useMemo(() => {
    const set = new Set<string>()
    for (const v of entradas ?? []) {
      const nome = resolveVendedor(v)
      if (nome && nome !== "—") set.add(nome)
    }
    return Array.from(set).sort()
  }, [entradas])

  // Aplicar filtros client-side
  const filtrados = useMemo(() => {
    return (entradas ?? []).filter((v) => {
      if (filtroCliente) {
        const nome = resolveName(v.cliente ?? v.customer).toLowerCase()
        if (!nome.includes(filtroCliente.toLowerCase())) return false
      }
      if (filtroStatus !== "todos") {
        const st = resolveStatus(v)
        if (!st || st.label.toLowerCase() !== filtroStatus.toLowerCase()) return false
      }
      if (filtroVendedor !== "todos") {
        if (resolveVendedor(v) !== filtroVendedor) return false
      }
      return true
    })
  }, [entradas, filtroCliente, filtroStatus, filtroVendedor])

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = useMemo(
    () => filtrados.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtrados, currentPage],
  )

  const hasFilters = filtroCliente || filtroStatus !== "todos" || filtroVendedor !== "todos"
  const clearFilters = () => { setFiltroCliente(""); setFiltroStatus("todos"); setFiltroVendedor("todos"); setPage(1) }

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
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                Limpar
              </button>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              {filtrados.length}/{entradas.length}
            </span>
          </div>
        </div>
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            <Input
              value={filtroCliente}
              onChange={(e) => { setFiltroCliente(e.target.value); setPage(1) }}
              placeholder="Buscar cliente"
              className="pl-7 h-7 text-xs"
            />
          </div>
          <Select value={filtroStatus} onValueChange={(v) => { setFiltroStatus(v); setPage(1) }}>
            <SelectTrigger className="h-7 text-xs w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
          {vendedores.length > 0 && (
            <Select value={filtroVendedor} onValueChange={(v) => { setFiltroVendedor(v); setPage(1) }}>
              <SelectTrigger className="h-7 text-xs w-[140px]">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {vendedores.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold">Data</TableHead>
                <TableHead className="text-xs font-semibold">Cliente</TableHead>
                <TableHead className="text-xs font-semibold">Vendedor</TableHead>
                <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Valor Total</TableHead>
                <TableHead className="text-xs font-semibold text-right">Lucro</TableHead>
                <TableHead className="text-xs font-semibold text-center">Margem</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pageItems.map((v, i) => {
                const lucro   = resolveLucro(v)
                const margem  = resolveMargem(v)
                const status  = resolveStatus(v)

                return (
                  <TableRow
                    key={String(v.id ?? i)}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    {/* Data */}
                    <TableCell className="py-1.5">
                      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {resolveData(v)}
                      </span>
                    </TableCell>

                    {/* Cliente */}
                    <TableCell className="py-1.5 max-w-[160px]">
                      <span className="text-xs font-medium leading-snug truncate block">
                        {resolveName(v.cliente ?? v.customer)}
                      </span>
                    </TableCell>

                    {/* Vendedor */}
                    <TableCell className="py-1.5">
                      <span className="text-xs text-muted-foreground">
                        {resolveVendedor(v)}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-1.5 text-center">
                      {status ? (
                        <Badge variant="outline" className={`text-xs px-1.5 py-0 font-medium ${status.cls}`}>
                          {status.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </TableCell>

                    {/* Valor Total */}
                    <TableCell className="py-1.5 text-right">
                      <span className="text-xs font-bold tabular-nums">
                        {brl(resolveValorTotal(v))}
                      </span>
                    </TableCell>

                    {/* Lucro */}
                    <TableCell className="py-1.5 text-right">
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          lucro > 0 ? "text-emerald-600 dark:text-emerald-400"
                          : lucro < 0 ? "text-red-500"
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
                          margem >= 20 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : margem >= 10 ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          : margem > 0 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {pct(margem)}
                      </Badge>
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
