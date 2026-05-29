import type { IntegrationStatusData } from "@/hooks/use-integration-status"
import type { TarefaDB } from "@/types/tarefas"

export type AlertSeverity = "critical" | "warning" | "info"
export type AlertSource =
  | "integracao"
  | "financeiro"
  | "tarefas"
  | "estoque"
  | "operacao"
  | "vendas"
  | "sistema"

export interface DashboardAlert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
  source: AlertSource
  timestamp: string
}

export type UserRole = "ADMIN" | "GERENTE" | "COLABORADOR"

interface AlertsInput {
  role: UserRole
  integrationStatus?: IntegrationStatusData | null
  faturamentoDia?: number | null
  loadingKpi?: boolean
  tarefasPendentes?: TarefaDB[]
  margemBruta?: number
  faturamentoMes?: number
  isHoje?: boolean
  // ── Consolidado (source of truth do financeiro) ─────────────────────────────
  margemReal?: number
  burnRate?: number
  lucroLiquidoReal?: number
  adminExpenses?: number
}

const MAX_ALERTS = 5

export function getDashboardAlerts(input: AlertsInput): DashboardAlert[] {
  const {
    role,
    integrationStatus,
    faturamentoDia,
    loadingKpi,
    tarefasPendentes = [],
    margemBruta,
    faturamentoMes,
    isHoje = false,
    margemReal,
    burnRate,
    lucroLiquidoReal,
    adminExpenses,
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
      timestamp: now,
    }, 300)
  }

  if (integrationStatus?.foneninjaStatus === "offline" && integrationStatus?.status !== "erro") {
    push({
      id: "foneninja-offline",
      severity: "warning",
      title: "Fone Ninja indisponível",
      description: "Sincronização suspensa.",
      source: "integracao",
      timestamp: now,
    }, 220)
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
        timestamp: now,
      }, 180)
    }
  } else if (!loadingKpi) {
    push({
      id: "sync-nunca",
      severity: "warning",
      title: "Sem sincronização registrada",
      description: "Nenhuma sync com o Fone Ninja foi registrada.",
      source: "integracao",
      timestamp: now,
    }, 170)
  }

  // ── vendas / financeiro ─────────────────────────────────────────────────────
  if (isHoje && faturamentoDia === 0 && !loadingKpi) {
    push({
      id: "sem-vendas-hoje",
      severity: "warning",
      title: "Sem vendas hoje",
      description: "Nenhuma venda registrada para hoje.",
      source: "vendas",
      timestamp: now,
    }, 250)
  }

  // Margem líquida REAL abaixo do ideal (3%)
  if (role !== "COLABORADOR" && margemReal !== undefined && margemReal > 0 && margemReal < 3 && (faturamentoMes ?? 0) > 0) {
    push({
      id: "margem-real-baixa",
      severity: "critical",
      title: "Margem líquida abaixo do ideal",
      description: `Margem real atual: ${margemReal.toFixed(1)}%. Revisar custos administrativos.`,
      source: "financeiro",
      timestamp: now,
    }, 280)
  }

  // Margem bruta crítica (< 10%)
  if (role !== "COLABORADOR" && margemBruta !== undefined && margemBruta < 10 && (faturamentoMes ?? 0) > 0 && !loadingKpi) {
    push({
      id: "margem-bruta-critica",
      severity: role === "ADMIN" ? "critical" : "warning",
      title: "Margem bruta crítica",
      description: `Margem bruta: ${margemBruta.toFixed(1)}%. Verifique custos.`,
      source: "financeiro",
      timestamp: now,
    }, 240)
  }

  // Despesas administrativas consumindo lucro
  if (
    role !== "COLABORADOR" &&
    adminExpenses !== undefined && lucroLiquidoReal !== undefined &&
    adminExpenses > 0 && lucroLiquidoReal > 0 && adminExpenses > lucroLiquidoReal
  ) {
    push({
      id: "admin-consome-lucro",
      severity: "critical",
      title: "Despesas administrativas consumindo lucro",
      description: "Custos administrativos superam o lucro líquido real.",
      source: "financeiro",
      timestamp: now,
    }, 270)
  }

  // Burn rate elevado
  if (
    role !== "COLABORADOR" && burnRate !== undefined && burnRate > 0 &&
    ((lucroLiquidoReal !== undefined && lucroLiquidoReal > 0 && burnRate > lucroLiquidoReal * 1.5) ||
      ((faturamentoMes ?? 0) > 0 && burnRate > (faturamentoMes ?? 0) * 0.05))
  ) {
    push({
      id: "burn-rate-elevado",
      severity: "warning",
      title: "Burn rate elevado",
      description: "Custo recorrente alto frente ao lucro real.",
      source: "financeiro",
      timestamp: now,
    }, 200)
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
      timestamp: now,
    }, 140)
  }

  // ── CRM / leads ─────────────────────────────────────────────────────────────
  if (role !== "COLABORADOR" && integrationStatus?.kommoStatus !== "online") {
    push({
      id: "kommo-desconectado",
      severity: "info",
      title: "Leads sem follow-up",
      description: "Kommo CRM não conectado — leads não rastreáveis.",
      source: "vendas",
      timestamp: now,
    }, 100)
  }

  // ── sort + role filter + cap ─────────────────────────────────────────────────
  let sorted = list.sort((a, b) => b.score - a.score).map((entry) => {
    const { score: _score, ...rest } = entry
    void _score
    return rest
  })

  if (role === "COLABORADOR" || role === "GERENTE") {
    sorted = sorted.filter((a) => a.source !== "financeiro")
  }

  return sorted.slice(0, MAX_ALERTS)
}
