import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
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
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum dado de vendedores no período.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Ticket médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((v, i) => {
                const nome = String(v.nome ?? v.name ?? "—")
                const fat  = Number(v.faturamento ?? 0)
                const qtd  = Number(v.totalVendas ?? v.vendas ?? 0)
                const tick = Number(v.ticketMedio ?? v.ticket ?? (qtd > 0 ? fat / qtd : 0))
                const isTop3 = i < 3
                return (
                  <TableRow key={i} className={cn(isTop3 ? DESTAQUE_BG[i] : "")}>
                    <TableCell className="text-base">
                      {MEDALHAS[i] ?? <span className="text-xs text-muted-foreground">{i + 1}</span>}
                    </TableCell>
                    <TableCell className={cn("font-medium", isTop3 && "text-foreground")}>{nome}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatBRL(fat)}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{qtd}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{formatBRL(tick)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
