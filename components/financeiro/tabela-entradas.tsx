import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface SaleRow {
  id?: string | number
  produto?: string
  nome_produto?: string
  product?: string
  cliente?: string | { nome?: string; name?: string } | null
  customer?: string | { nome?: string; name?: string } | null
  vendedor?: string | { nome?: string; name?: string } | null
  seller?: string | { nome?: string; name?: string } | null
  categoria?: string
  category?: string
  valorVenda?: number
  valor_total?: number
  preco?: number
  amount?: number
  lucro?: number
  lucro_bruto?: number
  margem?: number
  formaPagamento?: string
  payment_method?: string
  data?: string
  data_saida?: string
  createdAt?: string
  [key: string]: unknown
}

const pagamentoCor: Record<string, string> = {
  PIX: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Crédito: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Débito: "bg-purple-500/10 text-purple-600 border-purple-500/20",
}

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor)
}

function resolveNome(val: string | { nome?: string; name?: string } | null | undefined): string {
  if (!val) return "—"
  if (typeof val === "string") return val
  return val.nome ?? val.name ?? "—"
}

function resolveValor(row: SaleRow): number {
  return Number(row.valorVenda ?? row.valor_total ?? row.preco ?? row.amount ?? 0)
}

function resolveLucro(row: SaleRow): number {
  return Number(row.lucro ?? row.lucro_bruto ?? 0)
}

function resolveProduto(row: SaleRow): string {
  return String(row.produto ?? row.nome_produto ?? row.product ?? "—")
}

function resolveCategoria(row: SaleRow): string {
  return String(row.categoria ?? row.category ?? "—")
}

function resolvePagamento(row: SaleRow): string {
  return String(row.formaPagamento ?? row.payment_method ?? "—")
}

function resolveData(row: SaleRow): string {
  const raw = row.data ?? row.data_saida ?? row.createdAt
  if (!raw) return "—"
  try {
    return new Date(String(raw)).toLocaleDateString("pt-BR")
  } catch {
    return String(raw)
  }
}

export function TabelaEntradas({ entradas }: { entradas: SaleRow[] }) {
  if (!entradas || entradas.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Últimas Vendas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma venda no período.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Últimas Vendas Registradas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Produto</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Categoria</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Venda</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Lucro</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Pagamento</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((entrada, i) => {
                const valor = resolveValor(entrada)
                const lucro = resolveLucro(entrada)
                const pagamento = resolvePagamento(entrada)
                return (
                  <tr key={String(entrada.id ?? i)} className={i < entradas.length - 1 ? "border-b" : ""}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-xs">{resolveProduto(entrada)}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {resolveNome(entrada.cliente ?? entrada.customer)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {resolveCategoria(entrada)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-xs">
                      {brl(valor)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-emerald-600 font-medium">
                      {brl(lucro)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn("text-xs px-1.5", pagamentoCor[pagamento] ?? "")}
                      >
                        {pagamento}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {resolveData(entrada)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
