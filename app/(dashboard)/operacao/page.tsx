import { headers } from "next/headers"
import { ResumoOperacao } from "@/components/operacao/resumo-operacao"
import { AparelhoCard } from "@/components/operacao/aparelho-card"
import { InventarioEstoque } from "@/components/operacao/inventario-estoque"
import { getInventario } from "@/lib/services/api"
import { mockTradeIns, mockResumoOperacao } from "./data/mock"

export default async function OperacaoPage() {
  const requestHeaders = await headers()
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https")
  const baseUrl = host ? `${protocol}://${host}` : ""
  const { itens: inventario, error: inventarioErro } = await getInventario(baseUrl)

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold">Operação</h2>
        <p className="text-sm text-muted-foreground">
          Controle de estoque e inventário
        </p>
      </div>

      {/* Resumo operacional */}
      <ResumoOperacao resumo={mockResumoOperacao} />

      {/* Inventário real do backend */}
      {inventario.length > 0 && <InventarioEstoque itens={inventario} />}

      {/* Falha de integração */}
      {inventario.length === 0 && inventarioErro && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">Não foi possível carregar o inventário agora.</p>
          <p className="mt-1 text-red-800/80">Verifique a integração do estoque e tente novamente.</p>
        </div>
      )}

      {/* Placeholder quando ainda não há dados reais */}
      {inventario.length === 0 && !inventarioErro && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-medium">Aguardando dados de inventário...</p>
        </div>
      )}

      {/* Trade-ins (mock) */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          Trade-ins Recebidos
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            aparelhos recebidos aguardando ou com avaliação concluída
          </span>
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {mockTradeIns.map((a) => (
            <AparelhoCard key={a.id} aparelho={a} />
          ))}
        </div>
      </div>

    </div>
  )
}
