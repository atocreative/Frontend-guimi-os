"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOperationDashboard } from "@/lib/queries/use-operation-dashboard"
import type { InventoryItemFN } from "@/app/api/operation/dashboard/route"

type SortKey = "stockValue" | "stockQuantity" | "name"
type SortDir = "asc" | "desc"

const SORT_OPTIONS: { value: `${SortKey}:${SortDir}`; label: string }[] = [
  { value: "stockValue:desc", label: "Maior valor em estoque" },
  { value: "stockValue:asc",  label: "Menor valor em estoque" },
  { value: "stockQuantity:desc",   label: "Maior quantidade" },
  { value: "stockQuantity:asc",    label: "Menor quantidade" },
  { value: "name:asc",        label: "Nome A → Z" },
]

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)

function sortItems(items: InventoryItemFN[], key: SortKey, dir: SortDir): InventoryItemFN[] {
  return [...items].sort((a, b) => {
    let va: number | string
    let vb: number | string
    if (key === "stockValue") {
      va = a.stockValue ?? 0
      vb = b.stockValue ?? 0
    } else if (key === "stockQuantity") {
      va = a.stockQuantity
      vb = b.stockQuantity
    } else {
      va = a.productName
      vb = b.productName
      return dir === "asc"
        ? va.localeCompare(vb, "pt-BR")
        : vb.localeCompare(va, "pt-BR")
    }
    return dir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number)
  })
}

interface Props {
  showFinancial: boolean
}

export function InventarioCanonico({ showFinancial }: Props) {
  const now = new Date()
  const { data, isLoading } = useOperationDashboard(now.getMonth() + 1, now.getFullYear())

  const [sortPreset, setSortPreset] = useState<`${SortKey}:${SortDir}`>("stockValue:desc")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  const loading = isLoading && !data
  const rawItems = data?.inventory?.items ?? []

  const [sortKey, sortDir] = sortPreset.split(":") as [SortKey, SortDir]

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }

  const handleSortChange = (val: `${SortKey}:${SortDir}`) => {
    setSortPreset(val)
    setCurrentPage(1)
  }

  const filteredAndSortedItems = useMemo(() => {
    let items = rawItems
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      items = items.filter(item => 
        item.productName.toLowerCase().includes(q) || 
        (item.category && item.category.toLowerCase().includes(q))
      )
    }
    return sortItems(items, sortKey, sortDir)
  }, [rawItems, searchQuery, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / PAGE_SIZE))
  const paginatedItems = filteredAndSortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Inventário</CardTitle>
            {!loading && rawItems.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="h-9 w-full sm:w-48 pl-9 pr-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <select
                  value={SORT_OPTIONS.some((o) => o.value === sortPreset) ? sortPreset : "stockValue:desc"}
                  onChange={(e) => handleSortChange(e.target.value as `${SortKey}:${SortDir}`)}
                  className="h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-fit"
                >
                  {SORT_OPTIONS.filter((o) => showFinancial || !o.value.includes("stockValue")).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="animate-pulse divide-y">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-6 py-4 items-center">
                  <div className="h-3 w-4 rounded bg-muted shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-3 w-2/5 rounded bg-muted" />
                    <div className="h-2.5 w-1/4 rounded bg-muted/60" />
                  </div>
                  <div className="h-3 w-10 rounded bg-muted shrink-0" />
                  {showFinancial && <div className="h-3 w-20 rounded bg-muted shrink-0" />}
                </div>
              ))}
            </div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <div className="rounded-full bg-muted p-4">
                <Package className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm">Nenhum produto encontrado.</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-card border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground w-10">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Qtd</th>
                    {showFinancial && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Val. Estoque</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedItems.map((item, i) => (
                    <tr key={`${item.productName}-${i}`} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-3 text-xs text-muted-foreground tabular-nums">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-6 py-3 max-w-[280px]">
                        <p className="font-medium leading-tight truncate text-xs">{item.productName}</p>
                      </td>
                      <td className="px-6 py-3 hidden sm:table-cell">
                        {item.category ? (
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                            item.category.toUpperCase().includes("APARELHO")
                              ? "bg-blue-500/10 text-blue-600"
                              : item.category.toUpperCase().includes("ACESSORIO") || item.category.toUpperCase().includes("ACESSÓRIO")
                              ? "bg-purple-500/10 text-purple-600"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {item.category}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums font-semibold text-sm">
                        {item.stockQuantity.toLocaleString("pt-BR")}
                      </td>
                      {showFinancial && (
                        <td className="px-6 py-3 text-right tabular-nums text-xs font-medium">
                          {item.stockValue != null && item.stockValue > 0
                            ? formatBRL(item.stockValue)
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAndSortedItems.length > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-6 py-3 bg-card">
                  <span className="text-xs text-muted-foreground">
                    Mostrando {((currentPage - 1) * PAGE_SIZE) + 1} a {Math.min(currentPage * PAGE_SIZE, filteredAndSortedItems.length)} de {filteredAndSortedItems.length} produtos
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-transparent hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-medium px-2">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-transparent hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
