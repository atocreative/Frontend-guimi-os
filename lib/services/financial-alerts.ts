/**
 * Engine de alertas financeiros proporcionais.
 *
 * REGRA: comparações sempre usam períodos equivalentes.
 * Se mês atual (dia D), o mês anterior é escalonado por (D / diasMesAnterior).
 * Se mês encerrado, compara os totais completos de ambos os meses.
 */

export type AlertaTipo = "warning" | "success" | "info"

export interface AlertaFinanceiro {
  tipo: AlertaTipo
  mensagem: string
  /** Score interno para ordenação por relevância */
  score: number
}

export interface ComparativoFinanceiro {
  /** Faturamento do período selecionado */
  fat: number
  /** Faturamento do período equivalente anterior (já escalonado pelo chamador) */
  fatAnt: number
  lucro: number
  lucroAnt: number
  /** Margem líquida em % */
  margem: number
  margemAnt: number
  /** Margem bruta em % */
  margemBruta: number
  margemBrutaAnt: number
  desp: number
  despAnt: number
  vendas: number
  vendasAnt: number
  ticket: number
  /** Ticket médio NÃO é escalonado — já é um valor por venda */
  ticketAnt: number
  metaVendas: number
  isMesAtual: boolean
  diaAtual: number | null
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const T_VENDAS    = 5   // % para alertas de quantidade de vendas
const T_FAT       = 5   // % para faturamento
const T_LUCRO     = 8   // % para lucro líquido
const T_DESPESAS  = 8   // % para despesas (só dispara se acima do fat)
const T_TICKET    = 7   // % para ticket médio
const T_MARGEM_PP = 1.5 // pontos percentuais para margem

// ─── Helper ───────────────────────────────────────────────────────────────────

function delta(atual: number, anterior: number): number | null {
  if (!Number.isFinite(anterior) || anterior <= 0) return null
  if (!Number.isFinite(atual)) return null
  return ((atual - anterior) / anterior) * 100
}

// ─── Engine principal ─────────────────────────────────────────────────────────

export function calcularAlertasFinanceiros(
  c: ComparativoFinanceiro,
  maxAlertas = 5
): AlertaFinanceiro[] {
  const cand: Array<{ a: AlertaFinanceiro; score: number }> = []
  const ctx = c.isMesAtual ? "vs mesmo período do mês anterior" : "vs mês anterior"

  function push(score: number, tipo: AlertaTipo, mensagem: string) {
    cand.push({ score, a: { tipo, mensagem, score } })
  }

  // ── 1. CRÍTICO: lucro negativo ────────────────────────────────────────────
  if (c.fat > 0 && c.lucro < 0) {
    push(300, "warning", "Despesas superam o faturamento — lucro negativo")
  }

  // ── 2. Divergência fat↑ mas lucro↓ ───────────────────────────────────────
  const dFat   = delta(c.fat,   c.fatAnt)
  const dLucro = delta(c.lucro, c.lucroAnt)
  if (dFat !== null && dLucro !== null && dFat >= T_FAT && dLucro < -T_LUCRO) {
    push(200, "warning", `Lucro ↓ ${Math.abs(dLucro).toFixed(0)}% apesar do aumento de faturamento`)
  } else {
    // Faturamento
    if (dFat !== null && Math.abs(dFat) >= T_FAT) {
      const score = 100 + Math.abs(dFat) * (dFat < 0 ? 1.4 : 0.9)
      push(score, dFat > 0 ? "success" : "warning",
        dFat > 0
          ? `Faturamento ↑ ${dFat.toFixed(0)}% ${ctx}`
          : `Faturamento ↓ ${Math.abs(dFat).toFixed(0)}% ${ctx}`)
    }
    // Lucro líquido
    if (dLucro !== null && Math.abs(dLucro) >= T_LUCRO) {
      const score = 110 + Math.abs(dLucro) * (dLucro < 0 ? 1.4 : 0.9)
      push(score, dLucro > 0 ? "success" : "warning",
        dLucro > 0
          ? `Lucro líquido ↑ ${dLucro.toFixed(0)}% ${ctx}`
          : `Lucro líquido ↓ ${Math.abs(dLucro).toFixed(0)}% ${ctx}`)
    }
  }

  // ── 3. Vendas (quantidade) — BIDIRECIONAL ─────────────────────────────────
  const dVendas = delta(c.vendas, c.vendasAnt)
  if (dVendas !== null && Math.abs(dVendas) >= T_VENDAS) {
    const score = 90 + Math.abs(dVendas) * (dVendas < 0 ? 1.4 : 0.9)
    push(score, dVendas > 0 ? "success" : "warning",
      dVendas > 0
        ? `Vendas ↑ ${dVendas.toFixed(0)}% ${ctx} (${c.vendas} vs ${Math.round(c.vendasAnt)})`
        : `Vendas ↓ ${Math.abs(dVendas).toFixed(0)}% ${ctx} (${c.vendas} vs ${Math.round(c.vendasAnt)})`)
  }

  // ── 4. Margem líquida (pontos percentuais) ────────────────────────────────
  if (c.margemAnt > 0 && Number.isFinite(c.margem)) {
    const diffMargem = c.margem - c.margemAnt
    if (Math.abs(diffMargem) >= T_MARGEM_PP) {
      const score = 80 + Math.abs(diffMargem) * (diffMargem < 0 ? 10 : 6)
      push(score, diffMargem > 0 ? "success" : "warning",
        diffMargem > 0
          ? `Margem líquida ↑ ${diffMargem.toFixed(1)}pp — agora em ${c.margem.toFixed(1)}%`
          : `Margem líquida ↓ ${Math.abs(diffMargem).toFixed(1)}pp — agora em ${c.margem.toFixed(1)}%`)
    }
  }

  // ── 5. Despesas crescendo acima do faturamento ────────────────────────────
  const dDesp = delta(c.desp, c.despAnt)
  if (dDesp !== null && dFat !== null && dDesp > (dFat ?? 0) + T_DESPESAS && dDesp > T_DESPESAS) {
    push(75, "warning", `Despesas ↑ ${dDesp.toFixed(0)}% — acima do crescimento do faturamento`)
  }

  // ── 6. Ticket médio — BIDIRECIONAL ───────────────────────────────────────
  const dTicket = delta(c.ticket, c.ticketAnt)
  if (dTicket !== null && Math.abs(dTicket) >= T_TICKET) {
    const score = 60 + Math.abs(dTicket)
    push(score, dTicket > 0 ? "success" : "warning",
      dTicket > 0
        ? `Ticket médio ↑ ${dTicket.toFixed(0)}% ${ctx}`
        : `Ticket médio ↓ ${Math.abs(dTicket).toFixed(0)}% ${ctx}`)
  }

  // ── 7. Meta de vendas ─────────────────────────────────────────────────────
  if (c.isMesAtual && c.metaVendas > 0) {
    const faltam = c.metaVendas - c.vendas
    if (faltam <= 0) {
      push(50, "success", `Meta de ${c.metaVendas} vendas atingida`)
    } else if (faltam <= Math.ceil(c.metaVendas * 0.15)) {
      push(40, "info", `Faltam ${faltam} vendas para atingir a meta do mês`)
    } else if (c.diaAtual && c.diaAtual >= 20 && faltam > c.metaVendas * 0.3) {
      push(70, "warning", `Meta em risco — faltam ${faltam} vendas com ${31 - c.diaAtual} dias restantes`)
    }
  }

  cand.sort((a, b) => b.score - a.score)
  return cand.slice(0, maxAlertas).map((c) => c.a)
}

/**
 * Escala valores do mês anterior para comparação proporcional.
 * Se mês atual: escala para os mesmos N dias.
 * Se mês encerrado: retorna valor integral (scale = 1).
 */
export function calcularScale(
  isMesAtual: boolean,
  diaAtual: number | null,
  diasMesAnterior: number
): number {
  if (!isMesAtual || !diaAtual || diasMesAnterior <= 0) return 1
  return diaAtual / diasMesAnterior
}
