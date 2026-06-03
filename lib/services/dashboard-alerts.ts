import type { IntegrationStatusData } from "@/hooks/use-integration-status"
import type { TarefaDB } from "@/types/tarefas"

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
  /** Tooltip explaining origin + rule — displayed in the alert card */
  tooltip?: string
  timestamp: string
}

export type UserRole = "ADMIN" | "GERENTE" | "COLABORADOR"

interface AlertsInput {
  role: UserRole
  integrationStatus?: IntegrationStatusData | null
  faturamentoDia?: number | null
  loadingKpi?: boolean
  tarefasPendentes?: TarefaDB[]
  isHoje?: boolean
}

/** Alertas de integração e tarefas — fontes leves que não precisam de consolidado.
 *  Alertas financeiros e operacionais são construídos inline no componente
 *  a partir das suas fontes canônicas (consolidado + useAlertasOperacionais). */
export function getDashboardAlerts(input: AlertsInput): DashboardAlert[] {
  const {
    integrationStatus,
    faturamentoDia,
    loadingKpi,
    tarefasPendentes = [],
    isHoje = false,
  } = input

  const now = new Date().toISOString()
  const list: Array<DashboardAlert & { score: number }> = []
  const push = (alert: DashboardAlert, score: number) =>
    list.push({ ...alert, score })

  // ── integração ──────────────────────────────────────────────────────────────
  if (integrationStatus?.status === "erro") {
    push({
      id: "integracao-offline",
      severity: "critical",
      title: "Integração offline",
      description: "Fone Ninja não está respondendo — dados podem estar desatualizados.",
      source: "integracao",
      tooltip: "Origem: Integração\nRegra: Status da conexão com Fone Ninja",
      timestamp: now,
    }, 300)
  }

  if (integrationStatus?.lastSync) {
    const diffMin = (Date.now() - new Date(integrationStatus.lastSync).getTime()) / 60_000
    if (diffMin > 60) {
      push({
        id: "sync-atrasado",
        severity: "warning",
        title: "Sincronização atrasada",
        description: `Última sync há ${Math.round(diffMin)} min.`,
        source: "integracao",
        tooltip: "Origem: Integração\nRegra: Tempo sem sincronização com Fone Ninja",
        timestamp: now,
      }, 180)
    }
  }

  // ── vendas ──────────────────────────────────────────────────────────────────
  if (isHoje && faturamentoDia === 0 && !loadingKpi) {
    push({
      id: "sem-vendas-hoje",
      severity: "warning",
      title: "Sem vendas hoje",
      description: "Nenhuma venda registrada para hoje.",
      source: "vendas",
      tooltip: "Origem: Comercial\nRegra: Faturamento do dia igual a zero",
      timestamp: now,
    }, 250)
  }

  // ── tarefas ─────────────────────────────────────────────────────────────────
  const atrasadas = tarefasPendentes.filter((t) => {
    if (!t.dueAt) return false
    return new Date(t.dueAt) < new Date()
  })
  if (atrasadas.length > 0) {
    push({
      id: "tarefas-atrasadas",
      severity: atrasadas.length >= 3 ? "critical" : "warning",
      title: `${atrasadas.length} tarefa${atrasadas.length > 1 ? "s" : ""} em atraso`,
      description: "Tarefas com prazo vencido precisam de atenção.",
      source: "tarefas",
      tooltip: "Origem: Operação\nRegra: Tarefas com dueAt anterior à data atual",
      timestamp: now,
    }, 220)
  }

  if (tarefasPendentes.length >= 5) {
    push({
      id: "muitas-tarefas-pendentes",
      severity: "info",
      title: `${tarefasPendentes.length} tarefas pendentes`,
      description: "Carga elevada no backlog operacional.",
      source: "tarefas",
      tooltip: "Origem: Operação\nRegra: Backlog com 5 ou mais tarefas abertas",
      timestamp: now,
    }, 140)
  }

  return list
    .sort((a, b) => b.score - a.score)
    .map(({ score: _s, ...rest }) => rest)
}
