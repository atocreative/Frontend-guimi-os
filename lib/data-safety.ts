"use client"

import type { ConsolidadoPayload } from "@/lib/queries/use-financeiro-consolidado"

export type DataMode = "ok" | "warning_only" | "blocked"

export interface SafeInput {
  consolidado: ConsolidadoPayload | null | undefined
  isStable: boolean
  mode: DataMode
  drift: number
  fnOk: boolean
  maOk: boolean
  snapshotOk: boolean
}

function validateFN(input: SafeInput): SafeInput {
  const sourceType = input.consolidado?.breakdown?.fn?.sourceType
  const fnOk = sourceType === "live" || sourceType === "snapshot"
  return { ...input, fnOk, isStable: input.isStable && fnOk }
}

function validateMA(input: SafeInput): SafeInput {
  const count = input.consolidado?.breakdown?.meuAssessor?.count ?? 0
  return { ...input, maOk: count > 0 }
}

function validateSnapshot(input: SafeInput): SafeInput {
  const sourceType = input.consolidado?.breakdown?.fn?.sourceType
  return { ...input, snapshotOk: sourceType === "snapshot" || sourceType === "live" }
}

export function DataSafetyLayer(consolidado: ConsolidadoPayload | null | undefined): SafeInput {
  let input: SafeInput = {
    consolidado,
    isStable: true,
    mode: "ok",
    drift: 0,
    fnOk: false,
    maOk: false,
    snapshotOk: false,
  }

  input = validateFN(input)
  input = validateMA(input)
  input = validateSnapshot(input)

  if (input.drift > 0.01) {
    input.isStable = false
    input.mode = "warning_only"
  }

  if (!input.fnOk) {
    input.isStable = false
    input.mode = "blocked"
  }

  return input
}
