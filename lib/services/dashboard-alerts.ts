import type { TarefaDB } from "@/types/tarefas"
import type { KPIs } from "@/lib/services/comercial-bi"

export type AlertSeverity = "critical" | "warning" | "info"
export type AlertSource =
  | "integracao"
  | "financeiro"
  | "tarefas"
  | "operacao"
  | "vendas"
  | "ranking"

export interface DashboardAlert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
  source: AlertSource
  /** Tooltip explicando origem + regra — exibido no card de alerta */
  tooltip?: string
  timestamp: string
}

export type UserRole = "ADMIN" | "GERENTE" | "COLABORADOR"

interface AlertsInput {
  role: UserRole
  faturamentoDia?: number | null
  loadingKpi?: boolean
  tarefasPendentes?: TarefaDB[]
  isHoje?: boolean
  /** KPIs do CRM (mesma fonte que /comercial) — max 2 alertas gerados */
  comercialKPIs?: KPIs | null
}

/**
 * Alertas de negócio para o painel executivo.
 *
 * REGRA: Dashboard reutiliza alertas de fontes existentes.
 * NÃO cria regras novas — apenas agrega dados de hooks já ativos.
 *
 * Fontes cobertas aqui: vendas (faturamento zero), tarefas, comercial (CRM).
 * Fontes com lógica inline em dashboard-admin: financeiro, operação, ranking.
 */
export function getDashboardAlerts(input: AlertsInput): DashboardAlert[] {
  const {
    faturamentoDia,
    loadingKpi,
    tarefasPendentes = [],
    isHoje = false,
    comercialKPIs,
  } = input

  const now = new Date().toISOString()
  const list: Array<DashboardAlert & { score: number }> = []
  const push = (alert: DashboardAlert, score: number) =>
    list.push({ ...alert, score })

  // ── vendas (sem faturamento hoje) ───────────────────────────────────────────
  if (isHoje && faturamentoDia === 0 && !loadingKpi) {
    push({
      id: "sem-vendas-hoje",
      severity: "warning",
      title: "Sem vendas hoje",
      description: "Nenhuma venda registrada para hoje.",
      source: "vendas",
      tooltip: "Origem: Financeiro\nRegra: Faturamento do dia igual a zero no dia atual",
      timestamp: now,
    }, 250)
  }

  // ── tarefas atrasadas ────────────────────────────────────────────────────────
  const atrasadas = tarefasPendentes.filter(
    (t) => t.dueAt && new Date(t.dueAt) < new Date()
  )
  if (atrasadas.length > 0) {
    push({
      id: "tarefas-atrasadas",
      severity: atrasadas.length >= 3 ? "critical" : "warning",
      title: `${atrasadas.length} tarefa${atrasadas.length > 1 ? "s" : ""} em atraso`,
      description: "Tarefas com prazo vencido precisam de atenção.",
      source: "tarefas",
      tooltip: "Origem: Agenda\nRegra: Tarefas com data de vencimento anterior à data atual",
      timestamp: now,
    }, 220)
  }

  // ── comercial (max 2) — mesma fonte que /comercial/bi-dashboard ─────────────
  if (comercialKPIs) {
    const comercialList: Array<{ a: DashboardAlert; score: number }> = []

    const esq   = comercialKPIs.esquecidos ?? null
    const chats = comercialKPIs.chatsSemResposta ?? null
    const tresp = comercialKPIs.tempoRespostaMedio ?? null
    const stask = comercialKPIs.leadsSemTarefa ?? null
    const conv  = comercialKPIs.taxaConversao ?? null

    // Leads esquecidos — priority: critical
    if (esq != null && esq > 0) {
      comercialList.push({ score: 350, a: {
        id: "leads-esquecidos",
        severity: "critical",
        title: `${esq} lead${esq > 1 ? "s" : ""} esquecido${esq > 1 ? "s" : ""}`,
        description: "Leads sem interação recente — ação imediata necessária.",
        source: "vendas",
        tooltip: "Origem: Comercial\nRegra: Leads sem nenhuma interação por período prolongado",
        timestamp: now,
      }})
    }

    // Chats sem resposta
    if (chats != null && chats >= 100) {
      comercialList.push({ score: 340, a: {
        id: "chats-critico",
        severity: "critical",
        title: `${chats} chats sem resposta`,
        description: "Volume crítico de chats aguardando equipe.",
        source: "vendas",
        tooltip: "Origem: Comercial\nRegra: Mais de 100 chats sem resposta",
        timestamp: now,
      }})
    } else if (chats != null && chats >= 30) {
      comercialList.push({ score: 280, a: {
        id: "chats-acumulados",
        severity: "warning",
        title: `${chats} chats acumulados`,
        description: "Chats sem resposta se acumulando na fila.",
        source: "vendas",
        tooltip: "Origem: Comercial\nRegra: Mais de 30 chats sem resposta",
        timestamp: now,
      }})
    }

    // Tempo de resposta
    if (tresp != null && tresp >= 60) {
      comercialList.push({ score: 290, a: {
        id: "tresp-critico",
        severity: "critical",
        title: "Tempo de resposta crítico",
        description: `Média de ${Math.round(tresp)}min — meta: < 30min.`,
        source: "vendas",
        tooltip: "Origem: Comercial\nRegra: Tempo médio de resposta acima de 60 minutos",
        timestamp: now,
      }})
    } else if (tresp != null && tresp >= 30) {
      comercialList.push({ score: 230, a: {
        id: "tresp-alto",
        severity: "warning",
        title: "Tempo de resposta alto",
        description: `Média de ${Math.round(tresp)}min — meta: < 30min.`,
        source: "vendas",
        tooltip: "Origem: Comercial\nRegra: Tempo médio de resposta acima de 30 minutos",
        timestamp: now,
      }})
    }

    // Leads sem follow-up
    if (stask != null && stask >= 10) {
      comercialList.push({ score: 270, a: {
        id: "leads-sem-followup",
        severity: "warning",
        title: `${stask} leads sem follow-up`,
        description: "Leads sem próximo contato agendado.",
        source: "vendas",
        tooltip: "Origem: Comercial\nRegra: 10 ou mais leads sem tarefa de follow-up",
        timestamp: now,
      }})
    }

    // Conversão baixa
    if (conv != null && conv < 5) {
      comercialList.push({ score: 200, a: {
        id: "conversao-baixa",
        severity: "warning",
        title: `Conversão baixa: ${conv.toFixed(1)}%`,
        description: "Taxa abaixo de 5% — revisar abordagem comercial.",
        source: "vendas",
        tooltip: "Origem: Comercial\nRegra: Taxa de conversão de leads abaixo de 5%",
        timestamp: now,
      }})
    }

    comercialList
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .forEach(({ a, score }) => push(a, score))
  }

  return list
    .sort((a, b) => b.score - a.score)
    .map(({ score: _s, ...rest }) => rest)
}
