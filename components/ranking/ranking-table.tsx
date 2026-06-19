"use client"

import { Trophy, Award, Flame } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { PerformanceEntry } from "./types"

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

const posCls: Record<number, string> = {
  1: "text-amber-500 font-bold",
  2: "text-zinc-400 font-bold",
  3: "text-orange-600 font-bold",
}

function PosMedal({ pos }: { pos: number }) {
  if (pos === 1) return <Trophy className="h-4 w-4 text-amber-500 mx-auto" />
  if (pos === 2) return <Award className="h-4 w-4 text-zinc-400 mx-auto" />
  if (pos === 3) return <Award className="h-4 w-4 text-orange-600 mx-auto" />
  return <span className={cn("text-sm", posCls[pos] ?? "text-muted-foreground")}>{pos}º</span>
}

export function RankingTable({ entries }: { entries: PerformanceEntry[] }) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</p>
  }

  const topScore = entries[0]?.score || 1

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12 text-center text-xs">#</TableHead>
            <TableHead className="text-xs">Colaborador</TableHead>
            <TableHead className="text-right text-xs">Score</TableHead>
            <TableHead className="text-right text-xs">Tarefas</TableHead>
            <TableHead className="text-right text-xs hidden sm:table-cell">Total</TableHead>
            <TableHead className="text-right text-xs hidden md:table-cell">Conclusão</TableHead>
            <TableHead className="text-right text-xs hidden md:table-cell">Streak</TableHead>
            <TableHead className="w-28 text-xs hidden lg:table-cell">Performance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const perf = Math.round((entry.score / topScore) * 100)
            const isTop3 = entry.posicao <= 3

            return (
              <TableRow
                key={entry.userId}
                className={cn(entry.posicao === 1 && "bg-amber-500/4 hover:bg-amber-500/8")}
              >
                <TableCell className="text-center">
                  <PosMedal pos={entry.posicao} />
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={cn(
                        "text-xs font-bold",
                        isTop3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {getInitials(entry.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{entry.userName}</p>
                      {entry.nivel > 1 && (
                        <p className="text-[10px] text-muted-foreground">Nível {entry.nivel}</p>
                      )}
                    </div>
                    {entry.posicao === 1 && (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-400/30 hidden sm:flex">
                        Líder
                      </Badge>
                    )}
                    {entry.streak > 2 && (
                      <span className="hidden sm:inline-flex items-center gap-0.5 text-[11px] text-orange-400">
                        <Flame className="h-3 w-3" />{entry.streak}d
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <span className={cn("text-sm font-bold tabular-nums", entry.posicao === 1 ? "text-amber-500" : "")}>
                    {entry.score.toLocaleString("pt-BR")}
                  </span>
                </TableCell>

                <TableCell className="text-right text-sm tabular-nums">
                  {entry.tarefasConcluidas}
                </TableCell>

                <TableCell className="text-right text-sm tabular-nums text-muted-foreground hidden sm:table-cell">
                  {entry.activeAssignedTasksTotal ?? entry.tarefasPendentes}
                </TableCell>

                <TableCell className="text-right hidden md:table-cell">
                  <span className={cn(
                    "text-sm tabular-nums font-medium",
                    entry.taxaConclusao >= 80 ? "text-emerald-500" :
                    entry.taxaConclusao >= 50 ? "text-amber-500" : "text-rose-500"
                  )}>
                    {entry.taxaConclusao}%
                  </span>
                </TableCell>

                <TableCell className="text-right text-sm tabular-nums hidden md:table-cell">
                  {entry.streak > 0 ? `${entry.streak}d` : "—"}
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", entry.posicao === 1 ? "bg-amber-500" : "bg-primary/60")}
                        style={{ width: `${perf}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[11px] text-muted-foreground">{perf}%</span>
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
