import { getSession } from "@/lib/auth-session"
import { OperacaoCards } from "@/components/operacao/operacao-cards"
import { InventarioCanonico } from "@/components/operacao/inventario-canonico"
import { OperacaoTopProdutos } from "@/components/operacao/operacao-top-produtos"
import { AlertasOperacionais } from "@/components/operacao/alertas-operacionais"

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function OperacaoPage({ searchParams: _searchParams }: PageProps) {
  const session = await getSession()
  const userRole: string  = (session?.user as any)?.role ?? "COLABORADOR"
  const isSuperUser: boolean = Boolean((session?.user as any)?.isSuperUser)
  const showFinancial =
    ["SUPER_USER", "ADMIN", "GERENTE", "GESTOR"].includes(userRole) || isSuperUser

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Operação</h2>
        <p className="text-sm text-muted-foreground">Controle de estoque e inventário</p>
      </div>

      <OperacaoCards showFinancial={showFinancial} />

      <InventarioCanonico showFinancial={showFinancial} />

      <OperacaoTopProdutos showFinancial={showFinancial} />

      <AlertasOperacionais />
    </div>
  )
}
