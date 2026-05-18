"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { RankingFilters } from "./types"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const PERIODS = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Mês" },
  { value: "ano", label: "Ano" },
]

const currentYear = new Date().getFullYear()
const ANOS = Array.from({ length: 4 }, (_, i) => currentYear - i)

interface RankingFiltersProps {
  filters: RankingFilters
  onChange: (filters: RankingFilters) => void
}

export function RankingFiltersBar({ filters, onChange }: RankingFiltersProps) {
  const set = (partial: Partial<RankingFilters>) => onChange({ ...filters, ...partial })
  const showMonthYear = filters.period === "mes" || filters.period === "personalizado"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={filters.period} onValueChange={(v) => set({ period: v as RankingFilters["period"] })}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((p) => (
            <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showMonthYear && (
        <>
          <Select value={String(filters.month)} onValueChange={(v) => set({ month: Number(v) })}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(filters.year)} onValueChange={(v) => set({ year: Number(v) })}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {ANOS.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {filters.period === "ano" && (
        <Select value={String(filters.year)} onValueChange={(v) => set({ year: Number(v) })}>
          <SelectTrigger className="h-8 w-24 text-xs">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {ANOS.map((y) => (
              <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Input
        placeholder="Filtrar vendedor..."
        value={filters.seller}
        onChange={(e) => set({ seller: e.target.value })}
        className="h-8 w-44 text-xs"
      />
    </div>
  )
}
