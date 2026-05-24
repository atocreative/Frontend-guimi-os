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
}

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
  } = input

  const now = new Date().toISOString()
  const list: DashboardAlert[] = []

  // ── integração ──────────────────────────────────────────────────────────────
  if (integrationStatus?.status === "erro") {
    list.push({
      id: "integracao-offline",
      severity: "critical",
      title: "Integração offline",
      description: "Fone Ninja não está respondendo. Os dados podem estar desatualizados.",
      source: "integracao",
      timestamp: now,
    })
  }

  if (integrationStatus?.foneninjaStatus === "offline" && integrationStatus?.status !== "erro") {
    list.push({
      id: "foneninja-offline",
      severity: "warning",
      title: "Fone Ninja indisponível",
      description: "O serviço Fone Ninja está offline. Sincronização suspensa.",
      source: "integracao",
      timestamp: now,
    })
  }

  if (integrationStatus?.lastSync) {
    const diffMin = (Date.now() - new Date(integrationStatus.lastSync).getTime()) / 60_000
    if (diffMin > 60) {
      list.push({
        id: "sync-atrasado",
        severity: "warning",
        title: "Sincronização atrasada",
        description: `Última sync há ${Math.round(diffMin)} min. Dados podem estar defasados.`,
        source: "integracao",
        timestamp: now,
      })
    }
  } else if (!loadingKpi) {
    list.push({
      id: "sync-nunca",
      severity: "warning",
      title: "Sem sincronização registrada",
      description: "Nenhuma sync com o Fone Ninja foi registrada ainda.",
      source: "integracao",
      timestamp: now,
    })
  }

  if (integrationStatus?.cronStatus === "atrasado") {
    list.push({
      id: "cron-atrasado",
      severity: "warning",
      title: "Cron de sync atrasado",
      description: "O agendador de sincronização está com atraso. Verifique o backend.",
      source: "sistema",
      timestamp: now,
    })
  }

  // ── vendas / financeiro ─────────────────────────────────────────────────────
  if (isHoje && faturamentoDia === 0 && !loadingKpi) {
    list.push({
      id: "sem-vendas-hoje",
      severity: "warning",
      title: "Sem vendas hoje",
      description: "Nenhuma venda registrada para hoje.",
      source: "vendas",
      timestamp: now,
    })
  }

  if (role !== "COLABORADOR" && margemBruta !== undefined && margemBruta < 10 && (faturamentoMes ?? 0) > 0 && !loadingKpi) {
    list.push({
      id: "margem-critica",
      severity: role === "ADMIN" ? "critical" : "warning",
      title: "Margem bruta crítica",
      description: `Margem atual: ${margemBruta.toFixed(1)}%. Verifique custos e despesas.`,
      source: "financeiro",
      timestamp: now,
    })
  }

  // ── tarefas ─────────────────────────────────────────────────────────────────
  const atrasadas = tarefasPendentes.filter((t) => {
    if (!t.dueAt) return false
    return new Date(t.dueAt) < new Date()
  })
  if (atrasadas.length > 0) {
    list.push({
      id: "tarefas-atrasadas",
      severity: atrasadas.length >= 3 ? "critical" : "warning",
      title: `${atrasadas.length} tarefa${atrasadas.length > 1 ? "s" : ""} em atraso`,
      description: "Tarefas com prazo vencido precisam de atenção.",
      source: "tarefas",
      timestamp: now,
    })
  }

  // ── CRM / leads ─────────────────────────────────────────────────────────────
  if (role !== "COLABORADOR" && integrationStatus?.kommoStatus !== "online") {
    list.push({
      id: "kommo-desconectado",
      severity: "info",
      title: "Leads sem follow-up",
      description: "Kommo CRM não conectado — leads não podem ser rastreados.",
      source: "vendas",
      timestamp: now,
    })
  }

  // ── role filtering ───────────────────────────────────────────────────────────
  if (role === "COLABORADOR") {
    return list.filter((a) => a.source !== "financeiro")
  }
  if (role === "GERENTE") {
    // gerente não vê alertas de lucro/margem (financeiro source)
    return list.filter((a) => a.source !== "financeiro")
  }

  return list
}
