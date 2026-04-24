import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { mockDespesas } from "@/app/(dashboard)/data/mock"

type Despesa = (typeof mockDespesas)[number]

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor)
}

export function TabelaDespesas({ despesas }: { despesas: Despesa[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Lançamentos de Despesas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Categoria</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Valor</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Vencimento</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((despesa, i) => (
                <tr key={despesa.id} className={i < despesas.length - 1 ? "border-b" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs">{despesa.descricao}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {despesa.categoria}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-medium text-red-500">
                    {brl(despesa.valor)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(despesa.vencimento).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs px-1.5",
                        despesa.pago
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}
                    >
                      {despesa.pago ? "Pago" : "Pendente"}
                    </Badge>
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
