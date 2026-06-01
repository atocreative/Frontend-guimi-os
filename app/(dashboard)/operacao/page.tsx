import { getSession } from "@/lib/auth-session"
import { ResumoOperacao } from "@/components/operacao/resumo-operacao"
import { InventarioEstoque } from "@/components/operacao/inventario-estoque"
import { ProdutosMaisVendidos } from "@/components/operacao/produtos-mais-vendidos"
import { ApplePerformance } from "@/components/operacao/apple-intelligence"
import { AppleTrendCard } from "@/components/operacao/apple-trend-card"
import { AlertasOperacionais } from "@/components/operacao/alertas-operacionais"

// Acessa o backend diretamente — evita o self-call frágil via BFF interno.
const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
).replace(/\/$/, "")

// ─── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchSummary(token: string | null) {
  if (!BACKEND_URL) return null
  try {
    const res = await fetch(`${BACKEND_URL}/api/operacao/inventory/summary`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) { console.warn(`[operacao] summary ${res.status}`); return null }
    return await res.json()
  } catch (e: any) {
    console.error("[operacao] summary error:", e?.message)
    return null
  }
}

async function fetchInventory(
  token: string | null,
  params: Record<string, string>
): Promise<{ data: any[]; pagination: any; errorCode?: string; _meta?: any }> {
  const empty = { data: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } }
  if (!BACKEND_URL) return { ...empty, errorCode: "ENV_MISSING" }

  try {
    const qs = new URLSearchParams(params).toString()
    const url = `${BACKEND_URL}/api/operacao/inventory?${qs}`
    console.log(`[operacao:page] → GET ${url}`)
    const t0 = Date.now()

    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    }).catch((err) => { console.error(`[operacao:page] fetch error: ${err?.message}`); return null })

    if (!res) return { ...empty, errorCode: "BACKEND_UNREACHABLE" }
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[operacao:page] status=${res.status} body=${body.slice(0, 200)}`)
      return { ...empty, errorCode: `BACKEND_${res.status}` }
    }

    const data = await res.json().catch((e: any) => { console.error("[operacao:page] parse error:", e?.message); return null })
    if (!data) return { ...empty, errorCode: "PARSE_ERROR" }

    const ms = Date.now() - t0
    console.log(`[operacao:page] ✓ items=${Array.isArray(data.data) ? data.data.length : 0} total=${data.pagination?.total ?? "?"} source=${data._meta?.source ?? "?"} (${ms}ms)`)
    return data
  } catch (e: any) {
    console.error("[operacao:page] unhandled:", e?.message)
    return { ...empty, errorCode: "UNKNOWN" }
  }
}

async function fetchTopProducts(token: string | null) {
  if (!BACKEND_URL) return []
  try {
    const res = await fetch(`${BACKEND_URL}/api/operacao/top-products?limit=10`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json.data) ? json.data : []
  } catch (e: any) {
    console.error("[operacao] top-products error:", e?.message)
    return []
  }
}

async function fetchAppleInsights(token: string | null) {
  if (!BACKEND_URL) return null
  try {
    const res = await fetch(`${BACKEND_URL}/api/operacao/apple-insights`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch (e: any) {
    console.error("[operacao] apple-insights error:", e?.message)
    return null
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function OperacaoPage({ searchParams }: PageProps) {
  const params = await searchParams

  const session = await getSession()
  const userRole: string = (session?.user as any)?.role ?? "COLABORADOR"
  const isSuperUser: boolean = Boolean((session?.user as any)?.isSuperUser)
  const showFinancial =
    ["SUPER_USER", "ADMIN", "GERENTE", "GESTOR"].includes(userRole) || isSuperUser

  // Use || null (not ?? null) to also treat empty string as null
  const token: string | null = (session as any)?.accessToken || null

  const inventoryParams: Record<string, string> = {
    page: params.page ?? "1",
    perPage: params.perPage ?? "10",
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.tipo ? { tipo: params.tipo } : {}),
    ...(params.sort ? { sort: params.sort } : {}),
    ...(params.order ? { order: params.order } : {}),
  }

  const [summary, inventoryResult, topProducts, appleInsights] = await Promise.all([
    fetchSummary(token),
    fetchInventory(token, inventoryParams),
    fetchTopProducts(token),
    fetchAppleInsights(token),
  ])

  const lastSyncAt = (summary as any)?.lastSyncAt ?? null
  const syncLabel = lastSyncAt
    ? `Sincronizado ${new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", year: "2-digit",
        hour: "2-digit", minute: "2-digit",
      }).format(new Date(lastSyncAt))}`
    : "Nunca sincronizado"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Operação</h2>
          <p className="text-sm text-muted-foreground">
            Controle de estoque e inventário
            {lastSyncAt && (
              <span className="ml-2 text-xs text-muted-foreground/60">&middot; {syncLabel}</span>
            )}
          </p>
        </div>
      </div>

      <ResumoOperacao
        summary={summary}
        showFinancial={showFinancial}
        totalVendidos={
          Array.isArray(topProducts)
            ? topProducts.reduce(
                (acc: number, p: any) => acc + (Number(p?.quantidadeVendida) || 0),
                0,
              )
            : undefined
        }
      />

      <InventarioEstoque
        initialData={inventoryResult.data}
        initialPagination={inventoryResult.pagination}
        showFinancial={showFinancial}
        initialParams={inventoryParams}
        errorCode={inventoryResult.errorCode}
        canSync={showFinancial}
        meta={inventoryResult._meta}
      />

      <ProdutosMaisVendidos
        data={topProducts}
        showFinancial={showFinancial}
      />

      <ApplePerformance
        data={appleInsights}
        showFinancial={showFinancial}
      />

      <AppleTrendCard />

      <AlertasOperacionais />
    </div>
  )
}
