import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface VendedorItem {
  nome?: string
  name?: string
  faturamento?: number
  totalVendas?: number
  vendas?: number
  ticketMedio?: number
  ticket?: number
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v)

const MEDALHAS = ["🥇", "🥈", "🥉"]

const DESTAQUE_BG = [
  "bg-amber-50 dark:bg-amber-950/30",
  "bg-slate-50 dark:bg-slate-900/40",
  "bg-orange-50 dark:bg-orange-950/20",
]

interface Props {
  vendedores: VendedorItem[]
  loading?: boolean
}

export function VendedoresRanking({ vendedores, loading = false }: Props) {
  const lista = vendedores.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Ranking de Vendedores</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-px">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum dado de vendedores no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-6">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Vendedor</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Faturamento</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Vendas</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Ticket médio</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((v, i) => {
                  const nome = String(v.nome ?? v.name ?? "—")
                  const fat  = Number(v.faturamento ?? 0)
                  const qtd  = Number(v.totalVendas ?? v.vendas ?? 0)
                  const tick = Number(v.ticketMedio ?? v.ticket ?? (qtd > 0 ? fat / qtd : 0))
                  const isTop3 = i < 3

                  return (
                    <tr
                      key={i}
                      className={cn(
                        "border-b last:border-0 transition-colors",
                        isTop3 ? DESTAQUE_BG[i] : "hover:bg-muted/30"
                      )}
                    >
                      <td className="px-4 py-3 text-base">
                        {MEDALHAS[i] ?? <span className="text-xs text-muted-foreground">{i + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("font-medium", isTop3 && "text-foreground")}>
                          {nome}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatBRL(fat)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                        {qtd}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                        {formatBRL(tick)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
