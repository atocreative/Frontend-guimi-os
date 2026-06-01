"use client"

import { useQuery } from "@tanstack/react-query"

// ─── Shape canônico do payload ────────────────────────────────────────────────

export interface EstoqueCriticoItem {
  id: string
  produto: string
  estoque: number
  /** "critico" | "esgotado" etc. — usado apenas para realce visual */
  severidade?: string | null
}

export interface ReposicaoItem {
  id: string
  produto: string
  estoqueAtual: number
  vendas30d: number
  /** velocidade média (un./dia) — opcional, vindo do backend se disponível */
  velocidade?: number | null
}

export interface EstoqueParadoItem {
  id: string
  produto: string
  /** dias sem movimentação */
  diasParado: number
  /** sinaliza item premium (iPhone, MacBook, etc.) — backend pré-classifica */
  premium?: boolean
}

export interface AlertasOperacionaisPayload {
  estoqueCritico: EstoqueCriticoItem[]
  reposicaoRecomendada: ReposicaoItem[]
  estoqueParado: EstoqueParadoItem[]
  generatedAt?: string | null
}

const EMPTY: AlertasOperacionaisPayload = {
  estoqueCritico: [],
  reposicaoRecomendada: [],
  estoqueParado: [],
  generatedAt: null,
}

const STALE = 60 * 1_000          // 1 min — alertas operacionais não mudam por minuto
const GC    = 10 * 60 * 1_000     // 10 min em cache antes de coletar
const POLL  = 2 * 60 * 1_000      // refetch silencioso a cada 2 min

async function fetchAlertasOperacionais(): Promise<AlertasOperacionaisPayload> {
  const res = await fetch("/api/operacional/alertas-estoque", { cache: "no-store" })
  if (!res.ok) return EMPTY
  const j = (await res.json().catch(() => null)) as Partial<AlertasOperacionaisPayload> | null
  if (!j) return EMPTY
  return {
    estoqueCritico:        Array.isArray(j.estoqueCritico)        ? j.estoqueCritico        : [],
    reposicaoRecomendada:  Array.isArray(j.reposicaoRecomendada)  ? j.reposicaoRecomendada  : [],
    estoqueParado:         Array.isArray(j.estoqueParado)         ? j.estoqueParado         : [],
    generatedAt:           j.generatedAt ?? null,
  }
}

/**
 * Alertas Operacionais — fonte única consumida pelo bloco
 * "Estoque Crítico · Reposição Recomendada · Estoque Parado".
 *
 * Anti-flicker: `placeholderData` segura o frame anterior durante refetch;
 * `refetchInterval` silencioso, sem `refetchIntervalInBackground`.
 */
export function useAlertasOperacionais() {
  return useQuery<AlertasOperacionaisPayload>({
    queryKey: ["operacional", "alertas-estoque"] as const,
    queryFn: fetchAlertasOperacionais,
    staleTime: STALE,
    gcTime: GC,
    refetchInterval: POLL,
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev ?? EMPTY,
  })
}
