"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

interface CalendarProps {
  selected?: Date | null
  onSelect?: (date: Date) => void
}

export function Calendar({ selected, onSelect }: CalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = React.useState(
    selected?.getFullYear() ?? today.getFullYear()
  )
  const [viewMonth, setViewMonth] = React.useState(
    selected?.getMonth() ?? today.getMonth()
  )

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function isSelected(day: number) {
    return (
      selected != null &&
      selected.getFullYear() === viewYear &&
      selected.getMonth() === viewMonth &&
      selected.getDate() === day
    )
  }

  function isToday(day: number) {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    )
  }

  return (
    <div className="p-3 w-[280px] select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded p-1.5 hover:bg-muted transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {MESES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded p-1.5 hover:bg-muted transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DIAS.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => (
          <div key={i} className="flex justify-center">
            {day != null ? (
              <button
                type="button"
                onClick={() => onSelect?.(new Date(viewYear, viewMonth, day))}
                className={cn(
                  "h-8 w-8 rounded-full text-sm transition-colors",
                  isSelected(day)
                    ? "bg-primary text-primary-foreground font-medium"
                    : isToday(day)
                    ? "border border-primary text-primary font-medium hover:bg-muted"
                    : "hover:bg-muted"
                )}
              >
                {day}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
