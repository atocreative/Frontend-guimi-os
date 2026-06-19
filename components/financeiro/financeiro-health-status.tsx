"use client"

import { useFinanceiroHealth } from "@/lib/queries/use-financeiro-health"
import type { FinanceiroHealthPayload } from "@/lib/queries/use-financeiro-health"

function dot(isStable: boolean | undefined, sourceType?: string | null) {
  if (isStable === undefined || isStable === null) return "⚫"
  if (sourceType === "snapshot") return "🔵"
  if (isStable) return "🟢"
  return "🟡"
}

function badge(isStable: boolean | undefined, sourceType?: string | null) {
  if (isStable === undefined || isStable === null) return "Indisponível"
  if (sourceType === "snapshot") return "Snapshot"
  if (isStable) return "Live"
  return "Validando"
}

function Row({
  name,
  isStable,
  sourceType,
}: {
  name: string
  isStable: boolean | undefined
  sourceType?: string | null
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>{dot(isStable, sourceType)}</span>
      <span className="font-medium text-foreground">{name}:</span>
      <span>{badge(isStable, sourceType)}</span>
    </span>
  )
}

export function FinanceiroHealthStatus() {
  const { data, isLoading } = useFinanceiroHealth()

  if (isLoading && !data) return null

  const h = data as FinanceiroHealthPayload | undefined

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-muted/30 px-3 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 shrink-0">
        Dados Financeiros
      </span>
      <Row name="FN"       isStable={h?.fn?.isStable}       sourceType={h?.fn?.sourceType} />
      <Row name="MA"       isStable={h?.ma?.isStable} />
      <Row name="Snapshot" isStable={h?.snapshot?.isStable} />
    </div>
  )
}
