"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { PerformanceEntry } from "@/components/ranking/types"

const PAGE_SIZE = 5
const MEDALHAS = ["🥇", "🥈", "🥉"]

const TOP3_BG = [
  "bg-amber-50/80 dark:bg-amber-950/30 border-l-2 border-l-amber-400",
  "bg-slate-50/80 dark:bg-slate-900/40 border-l-2 border-l-slate-400",
  "bg-orange-50/80 dark:bg-orange-950/20 border-l-2 border-l-orange-300",
]

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
      {initials || "?"}
    </span>
  )
}

function ScoreBadge({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 px-1.5 text-[10px] font-semibold tabular-nums",
        pct >= 80
          ? "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400"
          : pct >= 50
            ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            : "border-muted-foreground/30 text-muted-foreground",
      )}
    >
      {value} pts
    </Badge>
  )
}

interface Props {
  entries: PerformanceEntry[]
  loading?: boolean
}

export function VendedoresRanking({ entries, loading = false }: Props) {
  const [page, setPage] = useState(0)

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const lista = entries.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const maxScore = entries[0]?.score ?? 0

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-sm font-semibold">Ranking de Desempenho</CardTitle>
          {entries.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {entries.length} colaborador{entries.length !== 1 ? "es" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0 pb-2">
        {loading ? (
          <div className="space-y-2 px-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum dado de ranking disponível.</p>
            <p className="text-xs text-muted-foreground/60">
              O ranking aparecerá quando houver atividade no período selecionado.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1">
              {lista.map((entry, i) => {
                const globalIndex = safePage * PAGE_SIZE + i
                const isTop3 = globalIndex < 3
                return (
                  <div
                    key={entry.userId}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 transition-colors",
                      isTop3 ? TOP3_BG[globalIndex] : "hover:bg-muted/40",
                    )}
                  >
                    <span className="w-6 shrink-0 text-center leading-none">
                      {isTop3
                        ? <span className="text-base">{MEDALHAS[globalIndex]}</span>
                        : <span className="text-xs font-bold text-muted-foreground">{globalIndex + 1}</span>
                      }
                    </span>
                    <Avatar name={entry.userName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{entry.userName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.tarefasConcluidas} concluídas · {entry.activeAssignedTasksTotal ?? entry.tarefasPendentes} ativas
                      </p>
                    </div>
                    <ScoreBadge value={entry.score} max={maxScore} />
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-2 flex items-center justify-center gap-2 px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {safePage + 1} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage === totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
