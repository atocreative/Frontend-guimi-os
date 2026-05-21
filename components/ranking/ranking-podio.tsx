"use client"

import { Trophy, Award, Flame } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PerformanceEntry } from "./types"

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

const MEDALS = [
  {
    label: "1º",
    ring: "ring-2 ring-amber-400/70",
    badge: "bg-amber-500/15 text-amber-500 border-amber-400/30",
    avatarBg: "bg-amber-500/20 text-amber-400",
    scoreColor: "text-amber-400",
    Icon: Trophy,
    iconCls: "text-amber-400",
    avatarSize: "h-20 w-20",
    textName: "text-base font-bold",
    cardCls: "border-amber-400/25 bg-gradient-to-b from-amber-500/8 to-transparent z-10",
  },
  {
    label: "2º",
    ring: "ring-2 ring-zinc-400/50",
    badge: "bg-zinc-400/10 text-zinc-400 border-zinc-400/25",
    avatarBg: "bg-zinc-500/20 text-zinc-300",
    scoreColor: "text-zinc-300",
    Icon: Award,
    iconCls: "text-zinc-400",
    avatarSize: "h-14 w-14",
    textName: "text-sm font-semibold",
    cardCls: "border-zinc-400/15 bg-gradient-to-b from-zinc-500/5 to-transparent",
  },
  {
    label: "3º",
    ring: "ring-2 ring-orange-700/40",
    badge: "bg-orange-900/20 text-orange-400 border-orange-700/25",
    avatarBg: "bg-orange-900/20 text-orange-400",
    scoreColor: "text-orange-400",
    Icon: Award,
    iconCls: "text-orange-400",
    avatarSize: "h-14 w-14",
    textName: "text-sm font-semibold",
    cardCls: "border-orange-700/15 bg-gradient-to-b from-orange-900/8 to-transparent",
  },
] as const

function PodioCard({ entry, rank, isTop1 }: { entry: PerformanceEntry; rank: 0 | 1 | 2; isTop1?: boolean }) {
  const m = MEDALS[rank]

  return (
    <div
      className={cn(
        "relative flex flex-col items-center rounded-2xl border text-center",
        m.cardCls,
        isTop1 ? "px-6 py-7" : "px-4 py-5"
      )}
    >
      <m.Icon className={cn("absolute right-3 top-3 shrink-0", m.iconCls, isTop1 ? "h-5 w-5" : "h-4 w-4")} />

      {/* Streak badge */}
      {entry.streak > 1 && (
        <span className="absolute left-3 top-3 flex items-center gap-0.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400">
          <Flame className="h-3 w-3" />{entry.streak}d
        </span>
      )}

      <Avatar className={cn(m.avatarSize, m.ring, "mb-3")}>
        <AvatarFallback className={cn("font-bold", m.avatarBg, isTop1 ? "text-lg" : "text-sm")}>
          {getInitials(entry.userName)}
        </AvatarFallback>
      </Avatar>

      <Badge variant="outline" className={cn("mb-2 px-2 py-0.5 text-xs font-bold", m.badge)}>
        {m.label} lugar
      </Badge>

      <p className={cn(m.textName, "mb-3 leading-tight")}>{entry.userName}</p>

      {/* Score — primary stat */}
      <div className="mb-2 w-full rounded-lg bg-black/20 px-3 py-2">
        <p className={cn("font-bold tabular-nums", m.scoreColor, isTop1 ? "text-2xl" : "text-lg")}>
          {entry.score.toLocaleString("pt-BR")}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">pontos</p>
      </div>

      {/* Secondary stats */}
      <div className="grid w-full grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-black/20 px-2 py-1.5 text-center">
          <p className={cn("font-semibold tabular-nums", isTop1 ? "text-sm" : "text-xs")}>{entry.tarefasConcluidas}</p>
          <p className="text-[10px] text-muted-foreground">Tarefas</p>
        </div>
        <div className="rounded-lg bg-black/20 px-2 py-1.5 text-center">
          <p className={cn("font-semibold tabular-nums", isTop1 ? "text-sm" : "text-xs")}>{entry.taxaConclusao}%</p>
          <p className="text-[10px] text-muted-foreground">Conclusão</p>
        </div>
        {entry.checklistsConcluidos > 0 && (
          <div className="col-span-2 rounded-lg bg-black/20 px-2 py-1.5 text-center">
            <p className={cn("font-semibold tabular-nums", isTop1 ? "text-sm" : "text-xs")}>{entry.checklistsConcluidos}</p>
            <p className="text-[10px] text-muted-foreground">Checklists</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function RankingPodio({ entries }: { entries: PerformanceEntry[] }) {
  const top3 = entries.slice(0, 3)
  const top1 = top3[0]
  const top2 = top3[1]
  const top3rd = top3[2]

  if (!top1) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed py-16 text-sm text-muted-foreground">
        Nenhum dado encontrado para o período selecionado.
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Mobile: vertical stack TOP 1 first */}
      <div className="flex flex-col gap-3 md:hidden">
        {top3.map((e, i) => (
          <PodioCard key={e.userId} entry={e} rank={i as 0 | 1 | 2} isTop1={i === 0} />
        ))}
      </div>

      {/* Desktop: TOP2 left · TOP1 center elevated · TOP3 right lower */}
      <div className="hidden items-end gap-4 md:grid md:grid-cols-3">
        <div className="mt-8">
          {top2 ? <PodioCard entry={top2} rank={1} /> : <div />}
        </div>
        <PodioCard entry={top1} rank={0} isTop1 />
        <div className="mt-14">
          {top3rd ? <PodioCard entry={top3rd} rank={2} /> : <div />}
        </div>
      </div>
    </div>
  )
}
