"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { RankingEntry } from "./types"

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

const posicaoCls: Record<number, string> = {
  1: "text-amber-500 font-bold",
  2: "text-zinc-400 font-bold",
  3: "text-orange-600 font-bold",
}

const posicaoMedal: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
}

interface RankingTableProps {
  entries: RankingEntry[]
}

export function RankingTable({ entries }: RankingTableProps) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum registro encontrado.
      </p>
    )
  }

  const top1Faturamento = entries[0]?.faturamento || 1

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-14 text-center text-xs">#</TableHead>
            <TableHead className="text-xs">Vendedor</TableHead>
            <TableHead className="text-right text-xs">Vendas</TableHead>
            <TableHead className="text-right text-xs">Faturamento</TableHead>
            <TableHead className="text-right text-xs">Ticket médio</TableHead>
            <TableHead className="w-32 text-xs">Participação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const participacao = Math.round((entry.faturamento / top1Faturamento) * 100)
            const isTop3 = entry.posicao <= 3

            return (
              <TableRow
                key={entry.sellerName}
                className={cn(
                  "transition-colors",
                  entry.posicao === 1 && "bg-amber-500/4 hover:bg-amber-500/8",
                )}
              >
                <TableCell className="text-center">
                  <span className={cn("text-sm", posicaoCls[entry.posicao] ?? "text-muted-foreground")}>
                    {posicaoMedal[entry.posicao] ?? `${entry.posicao}º`}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={cn(
                        "text-xs font-bold",
                        isTop3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {getInitials(entry.sellerName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{entry.sellerName}</span>
                    {entry.posicao === 1 && (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-400/30">
                        Líder
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {entry.totalVendas}
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums text-emerald-500">
                  {brl(entry.faturamento)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {brl(entry.ticketMedio)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          entry.posicao === 1 ? "bg-amber-500" : "bg-primary/60"
                        )}
                        style={{ width: `${participacao}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[11px] text-muted-foreground">{participacao}%</span>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
