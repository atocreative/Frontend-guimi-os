import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { ColaboradorResumo } from "@/types/colaboradores"

const podiumConfig = {
  0: {
    emoji: "🥇",
    order: "lg:order-2",
    scale: "lg:-mt-6",
    border: "border-amber-400/40 bg-amber-500/8",
  },
  1: {
    emoji: "🥈",
    order: "lg:order-1",
    scale: "",
    border: "border-zinc-300 bg-zinc-500/6",
  },
  2: {
    emoji: "🥉",
    order: "lg:order-3",
    scale: "lg:mt-4",
    border: "border-stone-400/50 bg-stone-500/8",
  },
} as const

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor)
}

function getMetaPercent(colaborador: ColaboradorResumo) {
  if (colaborador.metaMes <= 0) return 0
  return Math.round((colaborador.realizadoMes / colaborador.metaMes) * 100)
}

export function Podio({ colaboradores }: { colaboradores: ColaboradorResumo[] }) {
  const ordenado = [...colaboradores].sort((a, b) => {
    if (b.pontosMes !== a.pontosMes) return b.pontosMes - a.pontosMes
    return b.realizadoMes - a.realizadoMes
  })

  const top3 = ordenado.slice(0, 3)
  const visualOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold">
          Ranking do Mês — Março 2026
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3 lg:items-end">
          {visualOrder.map((colaborador) => {
            const rankingIndex = ordenado.findIndex((item) => item.id === colaborador.id)
            const config = podiumConfig[Math.min(rankingIndex, 2) as 0 | 1 | 2]
            const percentualMeta = getMetaPercent(colaborador)

            return (
              <div
                key={colaborador.id}
                className={cn(
                  "rounded-2xl border p-5 text-center shadow-sm",
                  config.order,
                  config.scale,
                  config.border
                )}
              >
                <div className="mb-3 text-4xl">{config.emoji}</div>
                <div className="mb-4 flex justify-center">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-zinc-900 text-lg font-bold text-white">
                      {colaborador.avatar}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold">{colaborador.nome}</p>
                  <p className="text-sm text-muted-foreground">{colaborador.jobTitle ?? "Cargo não informado"}</p>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-3xl font-bold">{colaborador.pontosMes}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    pontos no mês
                  </p>
                  <p className="text-sm font-medium text-emerald-600">
                    {colaborador.realizadoMes} vendas
                  </p>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Meta</span>
                    <span>{percentualMeta}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/50">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(percentualMeta, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Posição</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Faturamento</TableHead>
                <TableHead>Ticket Médio</TableHead>
                <TableHead>Conversão</TableHead>
                <TableHead>% da Meta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenado.map((colaborador, index) => (
                <TableRow key={colaborador.id}>
                  <TableCell className="font-semibold">{index + 1}º</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-zinc-900 text-xs font-bold text-white">
                          {colaborador.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{colaborador.nome}</p>
                        <p className="text-xs text-muted-foreground">{colaborador.jobTitle ?? "Cargo não informado"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{colaborador.vendasMes}</TableCell>
                  <TableCell className="font-medium text-emerald-600">
                    {colaborador.realizadoMes} apr
                  </TableCell>
                  <TableCell>{brl(colaborador.ticketMedio)}</TableCell>
                  <TableCell>{colaborador.taxaConversao}%</TableCell>
                  <TableCell>{getMetaPercent(colaborador)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
