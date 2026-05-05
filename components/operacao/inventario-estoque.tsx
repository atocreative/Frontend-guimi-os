import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, DollarSign, BarChart2 } from "lucide-react"

export interface InventarioItem {
  id?: string | number
  product_name?: string
  nome?: string
  quantidade?: number
  stock?: number
  valorUnitario?: number
  valor_unitario?: number
  valor_estoque?: number
  valorTotal?: number
  [key: string]: unknown
}

interface ItemNormalizado {
  id: string
  nome: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

function normalizar(item: InventarioItem, i: number): ItemNormalizado {
  const nome       = String(item.product_name ?? item.nome ?? "—")
  const quantidade = Number(item.quantidade ?? item.stock ?? 0)
  const valorTotal = Number(item.valor_estoque ?? item.valorTotal ?? 0)
  const valorUnitario = Number(
    item.valorUnitario ?? item.valor_unitario ??
    (quantidade > 0 ? valorTotal / quantidade : 0)
  )
  return {
    id: String(item.id ?? i),
    nome,
    quantidade,
    valorUnitario,
    valorTotal,
  }
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v)

interface Props {
  itens: InventarioItem[]
}

export function InventarioEstoque({ itens }: Props) {
  const lista: ItemNormalizado[] = itens
    .map(normalizar)
    .sort((a, b) => b.valorTotal - a.valorTotal)

  const valorTotalEstoque = lista.reduce((acc, i) => acc + i.valorTotal, 0)
  const totalItens        = lista.reduce((acc, i) => acc + i.quantidade, 0)
  const ticketMedioProduto = lista.length > 0
    ? valorTotalEstoque / lista.length
    : 0

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Total Estoque</p>
              <p className="text-lg font-bold">{formatBRL(valorTotalEstoque)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Itens</p>
              <p className="text-lg font-bold">{totalItens.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">{lista.length} produtos distintos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <BarChart2 className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ticket Médio por Produto</p>
              <p className="text-lg font-bold">{formatBRL(ticketMedioProduto)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Inventário — ordenado por valor em estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {lista.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhum item de estoque disponível.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">#</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Produto</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Qtd</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Valor Unit.</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((item, i) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{item.nome}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.quantidade}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {formatBRL(item.valorUnitario)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">
                        {formatBRL(item.valorTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/50">
                    <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold">Total</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold tabular-nums">{totalItens}</td>
                    <td />
                    <td className="px-4 py-2.5 text-right text-xs font-semibold tabular-nums">
                      {formatBRL(valorTotalEstoque)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
