import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/components/ui/table"

export interface DespesaItem {
  id?: string | number
  descricao?: string
  description?: string
  valor?: number
  value?: number
  amount?: number
  data_pagamento?: string
  payment_date?: string
  data?: string
  categoria?: string
  category?: string
  [key: string]: unknown
}

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor)
}

function resolveData(item: DespesaItem): string {
  const raw = item.data_pagamento ?? item.payment_date ?? item.data
  if (!raw) return "—"
  try { return new Date(String(raw)).toLocaleDateString("pt-BR") } catch { return String(raw) }
}

function calcularKpis(lista: DespesaItem[]) {
  const total = lista.reduce((acc, d) => acc + Number(d.valor ?? d.value ?? d.amount ?? 0), 0)

  // dias distintos com pagamento
  const dias = new Set(
    lista
      .map((d) => (d.data_pagamento ?? d.payment_date ?? d.data ?? "").slice(0, 10))
      .filter(Boolean)
  ).size

  const mediaDiaria = dias > 0 ? total / dias : 0
  return { total, mediaDiaria }
}

interface Props {
  despesas: DespesaItem[]
}

export function TabelaDespesas({ despesas }: Props) {
  if (!despesas || despesas.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Lançamentos de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma despesa no período.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { total, mediaDiaria } = calcularKpis(despesas)

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Despesas do Mês</p>
            <p className="text-xl font-bold text-red-500">{brl(total)}</p>
            <p className="text-xs text-muted-foreground">{despesas.length} lançamentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Média Diária</p>
            <p className="text-xl font-bold">{brl(mediaDiaria)}</p>
            <p className="text-xs text-muted-foreground">por dia com despesa</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Lançamentos de Despesas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {despesas.map((d, i) => {
                const descricao  = String(d.descricao ?? d.description ?? "—")
                const categoria  = String(d.categoria ?? d.category ?? "—")
                const valor      = Number(d.valor ?? d.value ?? d.amount ?? 0)
                return (
                  <TableRow key={String(d.id ?? i)}>
                    <TableCell className="font-medium text-xs">{descricao}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{categoria}</Badge></TableCell>
                    <TableCell className="text-right text-xs font-medium text-red-500 tabular-nums">{brl(valor)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{resolveData(d)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold text-red-500 tabular-nums">{brl(total)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
