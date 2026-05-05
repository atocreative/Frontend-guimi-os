import { ResumoOperacao } from "@/components/operacao/resumo-operacao"
import { AparelhoCard } from "@/components/operacao/aparelho-card"
import { InventarioEstoque, type InventarioItem } from "@/components/operacao/inventario-estoque"
import { headers } from "next/headers"
import {
  mockTradeIns,
  mockResumoOperacao,
} from "./data/mock"

async function fetchInventario(): Promise<InventarioItem[]> {
  try {
    const h = await headers()
    const host = h.get("host") ?? "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const res = await fetch(`${protocol}://${host}/api/operacao/inventory`, {
      cache: "no-store",
    })
    const json = await res.json().catch(() => null)
    return Array.isArray(json?.itens) ? json.itens : []
  } catch {
    return []
  }
}

export default async function OperacaoPage() {
  const inventario: InventarioItem[] = await fetchInventario()

  const temInventario = inventario.length > 0

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold">Operação</h2>
        <p className="text-sm text-muted-foreground">
          Controle de estoque e inventário
        </p>
      </div>

      {!temInventario && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">⚠️ Inventário indisponível</p>
          <p className="mt-1 text-xs">
            Não foi possível carregar dados de <code>/dashboard/inventory</code>.
            Verifique a conexão com o backend.
          </p>
        </div>
      )}

      {/* Resumo operacional (mock enquanto não há endpoint dedicado) */}
      <ResumoOperacao resumo={mockResumoOperacao} />

      {/* Inventário real do backend */}
      {temInventario && <InventarioEstoque itens={inventario} />}

      {/* Trade-ins (mock — endpoint não disponível ainda) */}
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
