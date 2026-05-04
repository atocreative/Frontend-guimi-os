export interface FeatureDefinition {
  featureId: string
  id: string // lowercase featureId for API calls
  name: string
  description: string
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  { featureId: "DASHBOARD",           id: "dashboard",           name: "Dashboard",          description: "Painel principal com métricas e resumo" },
  { featureId: "COMERCIAL",           id: "comercial",           name: "Comercial",           description: "Gestão de vendas e leads" },
  { featureId: "FINANCEIRO",          id: "financeiro",          name: "Financeiro",          description: "Controle financeiro e receitas" },
  { featureId: "AGENDA",              id: "agenda",              name: "Agenda e Tarefas",    description: "Agendamento e gestão de tarefas" },
  { featureId: "OPERACAO",            id: "operacao",            name: "Operação",            description: "Operações e processos internos" },
  { featureId: "PROCESSOS",           id: "processos",           name: "Processos",           description: "Checklists e fluxos operacionais" },
  { featureId: "COLABORADORES",       id: "colaboradores",       name: "Colaboradores",       description: "Gestão de equipe e usuários" },
  { featureId: "INDICADORES",         id: "indicadores",         name: "Indicadores",         description: "KPIs e métricas de desempenho" },
  { featureId: "CONFIGURACOES",       id: "configuracoes",       name: "Configurações",       description: "Configurações do sistema" },
  { featureId: "SUPORTE",             id: "suporte",             name: "Suporte",             description: "Central de ajuda e suporte" },
  { featureId: "SUPER_USER_DASHBOARD",id: "super_user_dashboard",name: "Dashboard Development",description: "Painel de desenvolvimento e feature flags" },
]

/**
 * Normalize raw backend dev-menu data into MenuConfigItems.
 * Backend may return { featureId, enabled, allowedRoles, pending? }.
 * This ensures every item always has id, name, and description.
 */
export function normalizeDevMenuItems(backendItems: any[]): import("@/lib/menu-config-context").MenuConfigItem[] {
  // Build a lookup from backend items by featureId or id
  const backendMap = new Map<string, any>()
  for (const item of backendItems) {
    const key = (item.featureId || item.id || "").toLowerCase()
    if (key) backendMap.set(key, item)
  }

  return FEATURE_DEFINITIONS.map((def) => {
    const backendItem = backendMap.get(def.id) ?? backendMap.get(def.featureId.toLowerCase())

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      enabled: backendItem?.enabled ?? true,
      pending: backendItem?.pending ?? false,
      allowedRoles: backendItem?.allowedRoles ?? [],
    }
  })
}
