"use client"

// ─── Shape canônico do payload ────────────────────────────────────────────────

export interface EstoqueCriticoItem {
  id: string
  produto: string
  estoque: number
  severidade?: string | null
}

export interface ReposicaoItem {
  id: string
  produto: string
  estoqueAtual: number
  vendas30d: number
  velocidade?: number | null
}

export interface EstoqueParadoItem {
  id: string
  produto: string
  diasParado: number
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

/**
 * Endpoint /api/operacional/alertas-estoque não existe no backend ainda.
 * Retorna EMPTY sem nenhuma chamada HTTP até o backend implementar o endpoint.
 */
export function useAlertasOperacionais() {
  return { data: EMPTY, isLoading: false, error: null }
}
