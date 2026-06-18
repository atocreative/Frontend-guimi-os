"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  WifiOff,
  ShieldOff,
  RefreshCw,
  RotateCcw,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventarioItem {
  id: string
  titulo: string
  marca?: string
  categoria?: string
  estoque: number
  status: string
  imei?: string | null
  cor?: string | null
  capacidade?: string | null
  tipo_produto?: string
  preco_varejo?: number
  custo?: number
  lucro?: number
  valor_estoque?: number
  margem?: number | null
}

interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

interface Meta {
  source?: string
  durationMs?: number
  lastSyncAt?: string | null
}

interface Props {
  initialData: InventarioItem[]
  initialPagination: Pagination
  showFinancial: boolean
  initialParams: Record<string, string>
  errorCode?: string
  canSync?: boolean
  meta?: Meta
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v)

const STATUS_COLOR: Record<string, string> = {
  disponivel: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  available:  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  ativo:      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  reservado:  "bg-amber-500/10  text-amber-600   border-amber-500/20",
  reserved:   "bg-amber-500/10  text-amber-600   border-amber-500/20",
  aguardando: "bg-blue-500/10   text-blue-600    border-blue-500/20",
  retirada:   "bg-blue-500/10   text-blue-600    border-blue-500/20",
  manutencao: "bg-red-500/10    text-red-600     border-red-500/20",
}

function getStatusColor(status: string) {
  const s = status.toLowerCase()
  for (const key of Object.keys(STATUS_COLOR)) {
    if (s.includes(key)) return STATUS_COLOR[key]
  }
  return "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
}

// ─── Sort presets ─────────────────────────────────────────────────────────────

interface SortPreset {
  value: string
  label: string
  financial?: boolean
}

const SORT_PRESETS: SortPreset[] = [
  { value: "valor_estoque:desc", label: "Maior valor estoque", financial: true },
  { value: "preco_varejo:desc",  label: "Maior ticket médio",  financial: true },
  { value: "preco_varejo:asc",   label: "Menor ticket médio",  financial: true },
  { value: "lucro:desc",         label: "Maior lucro",         financial: true },
  { value: "lucro:asc",          label: "Menor lucro",         financial: true },
  { value: "margem:desc",        label: "Maior margem",        financial: true },
  { value: "margem:asc",         label: "Menor margem",        financial: true },
  { value: "estoque:desc",       label: "Maior estoque" },
  { value: "estoque:asc",        label: "Menor estoque" },
  { value: "titulo:asc",         label: "Nome A → Z" },
  { value: "titulo:desc",        label: "Nome Z → A" },
]

function parseSortPreset(preset: string): { sort: string; order: string } {
  const [sort, order] = preset.split(":")
  return { sort: sort ?? "valor_estoque", order: order ?? "desc" }
}

function buildSortPreset(sort: string, order: string): string {
  return `${sort}:${order}`
}

// ─── Status filters ───────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "",           label: "Todos" },
  { value: "disponivel", label: "Disponível" },
  { value: "reservado",  label: "Pendente" },
  { value: "vendido",    label: "Concluído" },
]

const TIPO_TABS = [
  { value: "",          label: "Todos" },
  { value: "APARELHO",  label: "Aparelhos" },
  { value: "ACESSORIO", label: "Acessórios" },
]

// ─── Error state ──────────────────────────────────────────────────────────────

function errorMeta(code?: string): { icon: React.ElementType; title: string; desc: string } {
  if (!code) return {
    icon: AlertTriangle,
    title: "Não foi possível carregar o inventário",
    desc: "Verifique a integração e tente novamente.",
  }
  if (code === "ENV_MISSING") return {
    icon: AlertTriangle,
    title: "Configuração ausente",
    desc: "NEXT_PUBLIC_API_BASE_URL não está definida. Verifique o .env.",
  }
  if (code === "BACKEND_UNREACHABLE") return {
    icon: WifiOff,
    title: "Backend indisponível",
    desc: "Não foi possível conectar ao servidor.",
  }
  if (code === "BACKEND_401" || code === "BACKEND_403") return {
    icon: ShieldOff,
    title: "Sem permissão",
    desc: "Sua sessão pode ter expirado. Faça login novamente.",
  }
  if (code === "PARSE_ERROR") return {
    icon: AlertTriangle,
    title: "Erro ao processar resposta",
    desc: "O servidor retornou um formato inesperado.",
  }
  if (code.startsWith("BACKEND_5")) return {
    icon: WifiOff,
    title: "Serviço temporariamente indisponível",
    desc: "Tente novamente em instantes.",
  }
  return {
    icon: AlertTriangle,
    title: "Erro ao carregar inventário",
    desc: `Código: ${code}`,
  }
}

function ErrorState({
  code,
  canSync,
  onSync,
  syncing,
}: {
  code?: string
  canSync?: boolean
  onSync: () => void
  syncing: boolean
}) {
  const meta = errorMeta(code)
  const Icon = meta.icon

  return (
    <Card>
      <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-sm">{meta.title}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{meta.desc}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Recarregar
          </button>
          {canSync && (
            <button
              onClick={onSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {syncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {syncing ? "Sincronizando…" : "Sincronizar estoque"}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="animate-pulse divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-6 py-4 items-center">
          <div className="h-3 w-4 rounded bg-muted shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-3 w-2/5 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted/60" />
          </div>
          <div className="h-5 w-20 rounded-md bg-muted shrink-0" />
          <div className="h-3 w-8 rounded bg-muted shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InventarioEstoque({
  initialData,
  initialPagination,
  showFinancial,
  initialParams,
  errorCode,
  canSync = false,
  meta,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(initialParams.search ?? "")
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; text: string } | null>(null)

  const items = initialData
  const pagination = initialPagination
  const currentPage = pagination.page
  const totalPages = pagination.totalPages
  const total = pagination.total

  const currentPreset = buildSortPreset(
    initialParams.sort ?? "valor_estoque",
    initialParams.order ?? "desc"
  )
  const currentStatus = initialParams.status ?? ""
  const currentTipo = initialParams.tipo ?? ""
  const visiblePresets = SORT_PRESETS.filter((p) => !p.financial || showFinancial)

  function navigate(updates: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === "") p.delete(k)
      else p.set(k, v)
    }
    if (!("page" in updates)) p.set("page", "1")
    startTransition(() => router.push(`${pathname}?${p.toString()}`))
  }

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value)
      if (debounceTimer) clearTimeout(debounceTimer)
      const t = setTimeout(() => navigate({ search: value || undefined }), 400)
      setDebounceTimer(t)
    },
    [debounceTimer, searchParams]
  )

  const handleSortPreset = (preset: string) => {
    const { sort, order } = parseSortPreset(preset)
    navigate({ sort, order })
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/operacao/inventory/sync", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const count = data.itemsUpserted ?? data.itemsTotal
        setSyncResult({
          ok: true,
          text: count != null
            ? `Estoque atualizado — ${Number(count).toLocaleString("pt-BR")} itens sincronizados.`
            : "Estoque atualizado com sucesso.",
        })
        startTransition(() => router.refresh())
      } else {
        setSyncResult({ ok: false, text: data.error ?? "Falha ao sincronizar. Tente novamente." })
      }
    } catch {
      setSyncResult({ ok: false, text: "Erro de conexão. Verifique o servidor." })
    } finally {
      setSyncing(false)
    }
  }

  if (errorCode) {
    return (
      <ErrorState
        code={errorCode}
        canSync={canSync}
        onSync={handleSync}
        syncing={syncing}
      />
    )
  }

  const isEmpty = items.length === 0 && !isPending

  return (
    <div className="space-y-3">
      {/* Sync feedback — minimal, não intrusivo */}
      {syncResult && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm border border-border bg-muted/40">
          {syncResult.ok ? (
            <RefreshCw className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
          )}
          <span className={cn("flex-1", !syncResult.ok && "text-destructive")}>{syncResult.text}</span>
          <button
            onClick={() => setSyncResult(null)}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Title + count */}
            <div className="flex items-center gap-2.5 min-w-0">
              <CardTitle className="text-base">Inventário</CardTitle>
              {total > 0 && (
                <span className="text-sm text-muted-foreground">
                  {total.toLocaleString("pt-BR")} produto{total !== 1 ? "s" : ""}
                </span>
              )}
              {isPending && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar produto ou IMEI…"
                  className="pl-9 h-9 text-sm w-52"
                />
              </div>

              <select
                value={
                  visiblePresets.some((p) => p.value === currentPreset)
                    ? currentPreset
                    : (visiblePresets[0]?.value ?? "")
                }
                onChange={(e) => handleSortPreset(e.target.value)}
                className="h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {visiblePresets.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>

              {canSync && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {syncing ? "Sincronizando…" : "Sincronizar"}
                </button>
              )}
            </div>
          </div>

          {/* Tipo tabs */}
          <div className="flex gap-1.5 flex-wrap border-b pb-2">
            {TIPO_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => navigate({ tipo: t.value || undefined })}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  currentTipo === t.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => navigate({ status: f.value || undefined })}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  currentStatus === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isPending && items.length === 0 ? (
            <TableSkeleton />
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <div className="rounded-full bg-muted p-4">
                <Package className="h-6 w-6 opacity-40" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Nenhum produto encontrado</p>
                {search || currentStatus || currentTipo ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente ajustar os filtros ou{" "}
                    <button
                      onClick={() => {
                        setSearch("")
                        navigate({ search: undefined, status: undefined, tipo: undefined })
                      }}
                      className="text-primary underline underline-offset-2"
                    >
                      limpar a busca
                    </button>
                  </p>
                ) : canSync ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    O estoque ainda não foi sincronizado.{" "}
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className="text-primary underline underline-offset-2 disabled:opacity-50"
                    >
                      {syncing ? "Sincronizando…" : "Sincronizar agora"}
                    </button>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    O estoque está vazio ou ainda não foi sincronizado.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "transition-opacity duration-150",
                isPending && "opacity-50 pointer-events-none"
              )}
            >
              <table className="w-full text-sm">
                <thead className="bg-card border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground w-10">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Qtd</th>
                    {showFinancial && (
                      <>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Preço</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Lucro</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Val. Estoque</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Margem</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, i) => {
                    const idx = (currentPage - 1) * pagination.perPage + i + 1
                    const margemNum = item.margem != null ? Number(item.margem) : null
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-xs text-muted-foreground tabular-nums">{idx}</td>
                        <td className="px-6 py-4 max-w-[280px]">
                          <p className="font-medium leading-tight truncate">{item.titulo}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {[item.marca, item.capacidade, item.cor].filter(Boolean).join(" · ")}
                            {item.imei && (
                              <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/70">
                                {item.imei}
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {item.status ? (
                            <Badge
                              variant="outline"
                              className={cn("text-xs font-medium whitespace-nowrap", getStatusColor(item.status))}
                            >
                              {item.status}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums font-semibold">
                          {item.estoque}
                        </td>
                        {showFinancial && (
                          <>
                            <td className="px-6 py-4 text-right tabular-nums text-muted-foreground text-xs">
                              {item.preco_varejo ? formatBRL(item.preco_varejo) : "—"}
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-xs">
                              {item.lucro != null && item.lucro > 0 ? (
                                <span className="text-emerald-600 font-medium">{formatBRL(item.lucro)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums font-medium text-xs">
                              {item.valor_estoque ? formatBRL(item.valor_estoque) : "—"}
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-xs">
                              {margemNum != null ? (
                                <span
                                  className={cn(
                                    "font-medium",
                                    margemNum >= 20
                                      ? "text-emerald-600"
                                      : margemNum >= 10
                                      ? "text-amber-600"
                                      : "text-red-600"
                                  )}
                                >
                                  {margemNum.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination — Anterior | Página X de Y | Próxima */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t">
              <button
                disabled={currentPage <= 1 || isPending}
                onClick={() => navigate({ page: String(currentPage - 1) })}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              <p className="text-sm text-muted-foreground tabular-nums">
                Página <span className="font-medium text-foreground">{currentPage}</span> de{" "}
                <span className="font-medium text-foreground">{totalPages}</span>
                <span className="hidden sm:inline">
                  {" "}· {total.toLocaleString("pt-BR")} item{total !== 1 ? "s" : ""}
                </span>
              </p>

              <button
                disabled={currentPage >= totalPages || isPending}
                onClick={() => navigate({ page: String(currentPage + 1) })}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Próxima página"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
