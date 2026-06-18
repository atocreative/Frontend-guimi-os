import { getSession } from "@/lib/auth-session"
import { OperacaoCards } from "@/components/operacao/operacao-cards"
import { InventarioEstoque } from "@/components/operacao/inventario-estoque"
import { AlertasOperacionais } from "@/components/operacao/alertas-operacionais"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
).replace(/\/$/, "")

async function fetchInventory(
  token: string | null,
  params: Record<string, string>
): Promise<{ data: any[]; pagination: any; errorCode?: string; _meta?: any }> {
  const empty = { data: [], pagination: { page: 1, perPage: 10, total: 0, totalPages: 0 } }
  if (!BACKEND_URL) return { ...empty, errorCode: "ENV_MISSING" }

  try {
    const qs = new URLSearchParams(params).toString()
    const res = await fetch(`${BACKEND_URL}/api/operacao/inventory?${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null)

    if (!res) return { ...empty, errorCode: "BACKEND_UNREACHABLE" }
    if (!res.ok) return { ...empty, errorCode: `BACKEND_${res.status}` }

    const data = await res.json().catch(() => null)
    if (!data) return { ...empty, errorCode: "PARSE_ERROR" }
    return data
  } catch {
    return { ...empty, errorCode: "UNKNOWN" }
  }
}

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

  const inventoryResult = await fetchInventory(token, inventoryParams)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Operação</h2>
        <p className="text-sm text-muted-foreground">Controle de estoque e inventário</p>
      </div>

      <OperacaoCards showFinancial={showFinancial} />

      <InventarioEstoque
        initialData={inventoryResult.data}
        initialPagination={inventoryResult.pagination}
        showFinancial={showFinancial}
        initialParams={inventoryParams}
        errorCode={inventoryResult.errorCode}
        canSync={showFinancial}
        meta={inventoryResult._meta}
      />

      <AlertasOperacionais />
    </div>
  )
}
