/**
 * Engine de alertas focada APENAS em despesas (MeuAssessor).
 * NÃO conhece faturamento, lucro, margem ou ticket médio.
 *
 * Sinais avaliados:
 *  1. Crescimento total das despesas vs mês anterior
 *  2. Categorias críticas (peso > 35% do total)
 *  3. Variação anormal por categoria (Δ > 50%)
 *  4. Despesas sem classificação
 */

import type { DespesaRow } from "@/lib/queries/use-despesas"

export type AlertaTipo = "warning" | "success" | "info"

export interface AlertaDespesa {
  tipo: AlertaTipo
  mensagem: string
  score: number
}

const T_GROWTH_PCT    = 10   // alerta de crescimento total
const T_CRITICAL_PCT  = 35   // categoria crítica
const T_ANOMALY_PCT   = 50   // variação por categoria
const T_NO_CATEGORY_MIN = 1  // basta 1 sem categoria para informar

export interface AgregadoCategoria {
  categoria: string
  /** valor absoluto (sempre >= 0) para cálculo de peso */
  abs: number
  /** valor signed: SEMPRE negativo (saída) */
  signed: number
}

/**
 * Agrupa despesas por categoria, normalizando o sinal:
 * tudo sai NEGATIVO (regra: SAÍDA = negativo). Use sempre `signed` para
 * exibição em gráficos; use `abs` apenas para cálculo de peso percentual.
 */
export function agruparPorCategoria(rows: DespesaRow[]): {
  total: number          // negativo
  totalAbs: number       // positivo (para %)
  semCategoria: number
  grupos: AgregadoCategoria[]
} {
  const map = new Map<string, number>()
  let semCategoria = 0

  for (const r of rows) {
    const raw = Number(r.amount ?? r.valor ?? 0)
    if (!Number.isFinite(raw) || raw === 0) continue
    const abs = Math.abs(raw)
    const cat = (r.categoria ?? "").toString().trim()
    if (!cat) {
      semCategoria += 1
      map.set("Sem categoria", (map.get("Sem categoria") ?? 0) + abs)
      continue
    }
    map.set(cat, (map.get(cat) ?? 0) + abs)
  }

  const grupos: AgregadoCategoria[] = Array.from(map.entries())
    .map(([categoria, abs]) => ({ categoria, abs, signed: -abs }))
    .sort((a, b) => b.abs - a.abs)

  const totalAbs = grupos.reduce((s, g) => s + g.abs, 0)
  return { total: -totalAbs, totalAbs, semCategoria, grupos }
}

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(v)
}

export interface ContextoAlertas {
  /** despesas do mês corrente (positivo: total absoluto) */
  totalAtualAbs: number
  /** despesas do mês anterior (positivo: total absoluto, já escalonado se necessário) */
  totalAnteriorAbs: number
  gruposAtuais: AgregadoCategoria[]
  gruposAnteriores: AgregadoCategoria[]
  semCategoria: number
  isMesAtual: boolean
}

export function calcularAlertasDespesas(
  c: ContextoAlertas,
  maxAlertas = 4
): AlertaDespesa[] {
  const cand: AlertaDespesa[] = []
  const ctx = c.isMesAtual ? "vs mesmo período do mês anterior" : "vs mês anterior"

  // 1. Crescimento total
  if (c.totalAnteriorAbs > 0) {
    const delta = ((c.totalAtualAbs - c.totalAnteriorAbs) / c.totalAnteriorAbs) * 100
    if (Math.abs(delta) >= T_GROWTH_PCT) {
      cand.push({
        tipo: delta > 0 ? "warning" : "success",
        score: 200 + Math.abs(delta),
        mensagem:
          delta > 0
            ? `Despesas ↑ ${delta.toFixed(0)}% ${ctx} (${brl(c.totalAtualAbs)})`
            : `Despesas ↓ ${Math.abs(delta).toFixed(0)}% ${ctx} (${brl(c.totalAtualAbs)})`,
      })
    }
  }

  // 2. Categorias críticas (peso > T_CRITICAL_PCT do total)
  if (c.totalAtualAbs > 0) {
    for (const g of c.gruposAtuais.slice(0, 3)) {
      const peso = (g.abs / c.totalAtualAbs) * 100
      if (peso >= T_CRITICAL_PCT) {
        cand.push({
          tipo: "warning",
          score: 150 + peso,
          mensagem: `${g.categoria} concentra ${peso.toFixed(0)}% do gasto (${brl(g.abs)})`,
        })
      }
    }
  }

  // 3. Variação anormal por categoria
  const prevMap = new Map(c.gruposAnteriores.map((g) => [g.categoria, g.abs]))
  for (const g of c.gruposAtuais) {
    const prev = prevMap.get(g.categoria) ?? 0
    if (prev <= 0) continue
    const delta = ((g.abs - prev) / prev) * 100
    if (Math.abs(delta) >= T_ANOMALY_PCT) {
      cand.push({
        tipo: delta > 0 ? "warning" : "info",
        score: 120 + Math.abs(delta) * 0.5,
        mensagem:
          delta > 0
            ? `${g.categoria} ↑ ${delta.toFixed(0)}% ${ctx}`
            : `${g.categoria} ↓ ${Math.abs(delta).toFixed(0)}% ${ctx}`,
      })
    }
  }

  // 4. Sem categoria
  if (c.semCategoria >= T_NO_CATEGORY_MIN) {
    cand.push({
      tipo: "info",
      score: 50,
      mensagem: `${c.semCategoria} despesa${c.semCategoria > 1 ? "s" : ""} sem categoria — classificar para análise`,
    })
  }

  cand.sort((a, b) => b.score - a.score)
  return cand.slice(0, maxAlertas)
}

/**
 * Escala valores do mês anterior quando o mês atual ainda está em andamento.
 * Ex: dia 15 de um mês de 31 dias → scale = 15/30 (proporção do mês anterior).
 */
export function calcularScaleDespesas(
  isMesAtual: boolean,
  diaAtual: number | null,
  diasMesAnterior: number
): number {
  if (!isMesAtual || !diaAtual || diasMesAnterior <= 0) return 1
  return diaAtual / diasMesAnterior
}
