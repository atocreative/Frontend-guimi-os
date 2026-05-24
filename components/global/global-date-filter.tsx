"use client"

import { useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
]

export interface GlobalDateFilterProps {
  /** 0-indexed month */
  month: number
  year: number
  /** null = month mode (no specific day selected) */
  selectedDate?: Date | null
  /** Earliest selectable date in the calendar (default: 2020-01-01) */
  minDate?: Date
  /** Latest selectable date (default: today) */
  maxDate?: Date
  onMonthChange: (month: number, year: number) => void
  onToday: () => void
  /** date=null means "clear day, show full month" */
  onDateSelect: (date: Date | null) => void
  className?: string
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}

export function GlobalDateFilter({
  month,
  year,
  selectedDate,
  minDate,
  maxDate,
  onMonthChange,
  onToday,
  onDateSelect,
  className,
}: GlobalDateFilterProps) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  const min = minDate ?? new Date(2020, 0, 1)
  const max = maxDate ?? new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const isTodaySelected = !!selectedDate && isSameDay(selectedDate, today)
  const isMonthMode = !selectedDate
  const isCustomDate = !!selectedDate && !isTodaySelected

  function prevMonth() {
    if (month === 0) onMonthChange(11, year - 1)
    else onMonthChange(month - 1, year)
  }

  function nextMonth() {
    if (isCurrentMonth) return
    if (month === 11) onMonthChange(0, year + 1)
    else onMonthChange(month + 1, year)
  }

  return (
    <div className={cn("flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>

      {/* ── Left: month navigation ─────────────────────────────────── */}
      <div className="inline-flex items-center rounded-xl border border-border bg-card shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-l-xl rounded-r-none border-r border-border hover:bg-muted/60"
          onClick={prevMonth}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Button>

        <span className="min-w-[130px] select-none px-2 text-center text-sm font-semibold tracking-tight">
          {MESES[month]} {year}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-r-xl rounded-l-none border-l border-border hover:bg-muted/60 disabled:opacity-30"
          onClick={nextMonth}
          disabled={isCurrentMonth}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* ── Right: mode buttons + calendar picker ──────────────────── */}
      <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-1.5 py-1 shadow-sm">

        {/* Mês */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDateSelect(null)}
          className={cn(
            "h-7 rounded-lg px-3 text-xs font-medium transition-colors",
            isMonthMode && "bg-muted text-foreground shadow-none"
          )}
        >
          Mês
        </Button>

        {/* Hoje */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToday}
          className={cn(
            "h-7 rounded-lg px-3 text-xs font-medium transition-colors",
            isTodaySelected && "bg-muted text-foreground shadow-none"
          )}
        >
          Hoje
        </Button>

        {/* Date picker */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
                isCustomDate && "bg-muted text-foreground shadow-none"
              )}
              aria-label="Selecionar data específica"
            >
              <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {isCustomDate
                ? selectedDate!.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                : "Data"
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
            <Calendar
              mode="single"
              selected={selectedDate ?? undefined}
              defaultMonth={new Date(year, month)}
              onSelect={(date: Date | undefined) => {
                onDateSelect(date ?? null)
                setOpen(false)
              }}
              disabled={(date: Date) => date > max || date < min}
              initialFocus
            />
          </PopoverContent>
        </Popover>

      </div>
    </div>
  )
}
