"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PerformanceEntry } from "./types"

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

// ─── Level system ──────────────────────────────────────────────────────────

interface LevelTier {
  label: string
  min: number
  max: number
  color: string
  bg: string
  border: string
  bar: string
}

const TIERS: LevelTier[] = [
  { label: "Bronze",   min: 0,    max: 99,   color: "text-orange-700", bg: "bg-orange-900/15",  border: "border-orange-700/25", bar: "bg-orange-700/70" },
  { label: "Prata",    min: 100,  max: 249,  color: "text-zinc-300",   bg: "bg-zinc-500/10",   border: "border-zinc-400/20",   bar: "bg-zinc-400/70"   },
  { label: "Ouro",     min: 250,  max: 499,  color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-400/25",  bar: "bg-amber-400"     },
  { label: "Platina",  min: 500,  max: 999,  color: "text-cyan-300",   bg: "bg-cyan-500/10",   border: "border-cyan-400/20",   bar: "bg-cyan-400"      },
  { label: "Diamante", min: 1000, max: Infinity, color: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-400/25", bar: "bg-violet-400" },
]

function getTier(score: number): LevelTier {
  return TIERS.find((t) => score >= t.min && score <= t.max) ?? TIERS[0]
}

function getLevelProgress(score: number): number {
  const tier = getTier(score)
  if (tier.max === Infinity) return 100
  const range = tier.max - tier.min + 1
  return Math.round(((score - tier.min) / range) * 100)
}

const posMedal: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }

// ─── Component ─────────────────────────────────────────────────────────────

export function PerformanceCard({ entry }: { entry: PerformanceEntry }) {
  const tier = getTier(entry.score)
  const levelProgress = getLevelProgress(entry.score)
  const isTop3 = entry.posicao <= 3

  return (
    <Card className={cn(
      "overflow-hidden transition-colors duration-200 hover:bg-muted/30",
      isTop3 && tier.border,
    )}>
      <CardContent className="p-4 space-y-4">

        {/* Header: avatar + name + position */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar className={cn("h-11 w-11", isTop3 && `ring-2 ${tier.border}`)}>
              <AvatarFallback className={cn("text-sm font-bold", tier.bg, tier.color)}>
                {getInitials(entry.userName)}
              </AvatarFallback>
            </Avatar>
            {entry.posicao <= 3 && (
              <span className="absolute -right-1 -top-1 text-sm leading-none">
                {posMedal[entry.posicao]}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-semibold leading-tight truncate">{entry.userName}</p>
              {entry.posicao > 3 && (
                <span className="text-xs text-muted-foreground">{entry.posicao}º</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {entry.jobTitle ?? "Colaborador"}
            </p>
          </div>

          {/* Level badge */}
          <Badge variant="outline" className={cn("shrink-0 text-[10px] font-bold px-1.5", tier.bg, tier.color, tier.border)}>
            {tier.label}
          </Badge>
        </div>

        {/* Score + XP bar */}
        <div>
          <div className="flex items-end justify-between mb-1">
            <div>
              <span className={cn("text-xl font-bold tabular-nums", tier.color)}>
                {entry.score.toLocaleString("pt-BR")}
              </span>
              <span className="ml-1 text-[10px] text-muted-foreground uppercase tracking-wide">pts</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{levelProgress}% p/ próximo nível</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", tier.bar)}
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatBox
            label="Tarefas concluídas"
            value={entry.tarefasConcluidas}
            sub={`${entry.taxaConclusao}% de conclusão`}
            valueColor={entry.taxaConclusao >= 80 ? "text-emerald-500" : entry.taxaConclusao >= 50 ? "text-amber-500" : "text-rose-500"}
          />
          <StatBox
            label="Pendentes"
            value={entry.tarefasPendentes}
            sub={entry.tarefasAtrasadas > 0 ? `${entry.tarefasAtrasadas} atrasada(s)` : "Em dia"}
            valueColor={entry.tarefasAtrasadas > 0 ? "text-rose-400" : "text-muted-foreground"}
          />
        </div>

        {/* Bottom row: streak + checklists + no prazo */}
        <div className="flex flex-wrap gap-2 border-t pt-3">
          <Chip
            icon={entry.streak > 0 ? "🔥" : "💤"}
            label={entry.streak > 0 ? `${entry.streak}d streak` : "Sem streak"}
            className={entry.streak > 2 ? "text-orange-400" : "text-muted-foreground"}
          />
          {entry.checklistsConcluidos > 0 && (
            <Chip icon="✅" label={`${entry.checklistsConcluidos} checklist${entry.checklistsConcluidos > 1 ? "s" : ""}`} className="text-emerald-500" />
          )}
          {entry.tarefasNoPrazo > 0 && (
            <Chip icon="⏱" label={`${entry.tarefasNoPrazo} no prazo`} className="text-cyan-400" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatBox({ label, value, sub, valueColor }: { label: string; value: number; sub: string; valueColor?: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className={cn("text-lg font-bold tabular-nums leading-tight", valueColor)}>{value}</p>
      <p className="text-[10px] font-medium text-muted-foreground leading-tight">{label}</p>
      <p className="text-[10px] text-muted-foreground/70 leading-tight">{sub}</p>
    </div>
  )
}

function Chip({ icon, label, className }: { icon: string; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[11px] font-medium", className)}>
      <span>{icon}</span>
      {label}
    </span>
  )
}
