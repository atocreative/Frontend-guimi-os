import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { mockEntradas } from "@/app/(dashboard)/data/mock"

type Entrada = (typeof mockEntradas)[number]

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

export function TabelaEntradas({ entradas }: { entradas: Entrada[] }) {
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
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Margem</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Pagamento</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((entrada, i) => (
                <tr key={entrada.id} className={i < entradas.length - 1 ? "border-b" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs">{entrada.produto}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {entrada.cliente}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {entrada.categoria}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-xs">
                    {brl(entrada.valorVenda)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-emerald-600 font-medium">
                    {brl(entrada.lucro)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {entrada.margem}%
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn("text-xs px-1.5", pagamentoCor[entrada.formaPagamento] ?? "")}
                    >
                      {entrada.formaPagamento}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(entrada.data).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
