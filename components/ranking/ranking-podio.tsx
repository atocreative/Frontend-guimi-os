"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RankingEntry } from "./types"

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

const MEDALS = [
  {
    label: "1º",
    ring: "ring-2 ring-amber-400/70",
    glow: "shadow-[0_0_24px_rgba(251,191,36,0.25)]",
    badge: "bg-amber-500/15 text-amber-500 border-amber-400/30",
    avatarBg: "bg-amber-500/20 text-amber-400",
    icon: "🥇",
    size: "h-20 w-20",
    textName: "text-base font-bold",
    cardCls: "border-amber-400/25 bg-gradient-to-b from-amber-500/8 to-transparent scale-[1.04] z-10",
  },
  {
    label: "2º",
    ring: "ring-2 ring-zinc-400/50",
    glow: "shadow-[0_0_16px_rgba(161,161,170,0.15)]",
    badge: "bg-zinc-400/10 text-zinc-400 border-zinc-400/25",
    avatarBg: "bg-zinc-500/20 text-zinc-300",
    icon: "🥈",
    size: "h-14 w-14",
    textName: "text-sm font-semibold",
    cardCls: "border-zinc-400/15 bg-gradient-to-b from-zinc-500/5 to-transparent",
  },
  {
    label: "3º",
    ring: "ring-2 ring-orange-700/40",
    glow: "shadow-[0_0_16px_rgba(180,83,9,0.12)]",
    badge: "bg-orange-900/20 text-orange-400 border-orange-700/25",
    avatarBg: "bg-orange-900/20 text-orange-400",
    icon: "🥉",
    size: "h-14 w-14",
    textName: "text-sm font-semibold",
    cardCls: "border-orange-700/15 bg-gradient-to-b from-orange-900/8 to-transparent",
  },
]

interface PodioCardProps {
  entry: RankingEntry
  rank: 0 | 1 | 2
  isTop1?: boolean
}

function PodioCard({ entry, rank, isTop1 }: PodioCardProps) {
  const m = MEDALS[rank]

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-300 hover:-translate-y-1",
        m.cardCls,
        m.glow,
        isTop1 ? "px-6 py-7" : "px-4 py-5"
      )}
    >
      {/* Medal icon top-right */}
      <span className={cn("absolute right-3 top-3 text-xl", isTop1 ? "text-2xl" : "")}>{m.icon}</span>

      {/* Avatar */}
      <Avatar className={cn(m.size, m.ring, "mb-3 transition-transform duration-300 group-hover:scale-105")}>
        <AvatarFallback className={cn("font-bold", m.avatarBg, isTop1 ? "text-lg" : "text-sm")}>
          {getInitials(entry.sellerName)}
        </AvatarFallback>
      </Avatar>

      {/* Position badge */}
      <Badge variant="outline" className={cn("mb-2 px-2 py-0.5 text-xs font-bold", m.badge)}>
        {m.label} lugar
      </Badge>

      {/* Name */}
      <p className={cn(m.textName, "mb-3 leading-tight")}>{entry.sellerName}</p>

      {/* Stats */}
      <div className="w-full space-y-1.5">
        <div className="rounded-lg bg-black/20 px-3 py-2">
          <p className={cn("font-bold tabular-nums text-emerald-400", isTop1 ? "text-xl" : "text-base")}>
            {brl(entry.faturamento)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Faturamento</p>
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1 rounded-lg bg-black/20 px-2 py-1.5 text-center">
            <p className={cn("font-semibold tabular-nums", isTop1 ? "text-sm" : "text-xs")}>{entry.totalVendas}</p>
            <p className="text-[10px] text-muted-foreground">Vendas</p>
          </div>
          <div className="flex-1 rounded-lg bg-black/20 px-2 py-1.5 text-center">
            <p className={cn("font-semibold tabular-nums", isTop1 ? "text-sm" : "text-xs")}>{brl(entry.ticketMedio)}</p>
            <p className="text-[10px] text-muted-foreground">Ticket</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface RankingPodioProps {
  entries: RankingEntry[]
}

export function RankingPodio({ entries }: RankingPodioProps) {
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
      {/* Mobile: vertical stack, TOP 1 first */}
      <div className="flex flex-col gap-3 md:hidden">
        {top3.map((entry, i) => (
          <PodioCard key={entry.sellerName} entry={entry} rank={i as 0 | 1 | 2} isTop1={i === 0} />
        ))}
      </div>

      {/* Desktop: 3-column with TOP 1 center + elevated */}
      <div className="hidden items-end gap-4 md:grid md:grid-cols-3">
        {/* TOP 2 — left, slightly lower */}
        <div className="mt-8">
          {top2 ? <PodioCard entry={top2} rank={1} /> : <div />}
        </div>

        {/* TOP 1 — center, elevated */}
        <PodioCard entry={top1} rank={0} isTop1 />

        {/* TOP 3 — right, lowest */}
        <div className="mt-14">
          {top3rd ? <PodioCard entry={top3rd} rank={2} /> : <div />}
        </div>
      </div>
    </div>
  )
}
