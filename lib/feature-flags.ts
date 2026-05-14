/**
 * Feature Flags System
 * Manage feature availability across the application
 */

export type UserRole = 'ADMIN' | 'GERENTE' | 'COLABORADOR' | 'SUPER_USER' | 'GESTOR'

export interface FeatureFlag {
  id: string
  name: string
  description: string
  enabled: boolean
  requiredRole?: UserRole
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Core pages - always enabled
  DASHBOARD: {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Main dashboard with KPIs',
    enabled: true,
  },

  // Commercial module
  COMERCIAL: {
    id: 'comercial',
    name: 'Comercial',
    description: 'Sales and leads management (Kommo CRM integration)',
    enabled: true,
    requiredRole: 'GERENTE', // Available for GERENTE, ADMIN, SUPER_USER
  },

  // Financial module
  FINANCEIRO: {
    id: 'financeiro',
    name: 'Financeiro',
    description: 'Financial data and reports',
    enabled: true,
    requiredRole: 'ADMIN',
  },

  // Operations module
  OPERACAO: {
    id: 'operacao',
    name: 'Operação',
    description: 'Operations and inventory management',
    enabled: true,
    requiredRole: 'COLABORADOR', // Available for all roles
  },

  // Agenda/Tasks module
  AGENDA: {
    id: 'agenda',
    name: 'Agenda e Tarefas',
    description: 'Tasks and schedule management',
    enabled: true,
  },

  // Processes/Workflows module
  PROCESSOS: {
    id: 'processos',
    name: 'Processos',
    description: 'Workflow and process management',
    enabled: false, // Coming soon - not implemented
  },

  // Ranking module (formerly Colaboradores - Scope 2 section 5.6)
  RANKING: {
    id: 'ranking',
    name: 'Ranking',
    description: 'Employee ranking and gamification',
    enabled: true,
  },

  // Support/Help module
  SUPORTE: {
    id: 'suporte',
    name: 'Suporte',
    description: 'Support and help resources',
    enabled: true,
  },

  // Integrations module
  INTEGRACOES: {
    id: 'integracoes',
    name: 'Integrações',
    description: 'Integration management and synchronization',
    enabled: true,
  },

  // Configuration/Settings module
  CONFIGURACOES: {
    id: 'configuracoes',
    name: 'Configurações',
    description: 'System settings and configuration',
    enabled: true,
  },

  // Developer/Super User features
  SUPER_USER_DASHBOARD: {
    id: 'super_user_dashboard',
    name: 'Developer Dashboard',
    description: 'Feature flag management and developer tools',
    enabled: true,
    requiredRole: 'SUPER_USER',
  },
}

/**
 * Check if a feature is enabled for a user
 */
export function isFeatureEnabled(
  featureName: string,
  userRole?: UserRole,
): boolean {
  const flag = FEATURE_FLAGS[featureName]
  if (!flag) return false

  // Check hardcoded feature flag state
  if (!flag.enabled) return false

  // If feature requires a specific role, check user has it
  if (flag.requiredRole && userRole) {
    // Role hierarchy: SUPER_USER > ADMIN > GERENTE > COLABORADOR
    const roleHierarchy: Record<UserRole, number> = {
      SUPER_USER: 5,
      ADMIN: 3,
      GERENTE: 2,
      GESTOR: 2, // Backward compat with backend
      COLABORADOR: 1,
    }

    const requiredLevel = roleHierarchy[flag.requiredRole as UserRole] || 0
    const userLevel = roleHierarchy[userRole] || 0

    if (userLevel < requiredLevel) {
      return false
    }
  }

  return true
}

/**
 * Get all enabled features for a user
 */
export function getEnabledFeatures(userRole?: UserRole): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter((flag) =>
    isFeatureEnabled(flag.id.toUpperCase(), userRole),
  )
}

/**
 * Get page route based on feature flag
 */
export interface PageRoute {
  href: string
  title: string
  enabled: boolean
  featureId: string
}

export const PAGE_ROUTES: Record<string, PageRoute> = {
  DASHBOARD: { href: '/', title: 'Dashboard', enabled: true, featureId: 'DASHBOARD' },
  COMERCIAL: { href: '/comercial', title: 'Comercial', enabled: true, featureId: 'COMERCIAL' },
  FINANCEIRO: { href: '/financeiro', title: 'Financeiro', enabled: true, featureId: 'FINANCEIRO' },
  OPERACAO: { href: '/operacao', title: 'Operação', enabled: true, featureId: 'OPERACAO' },
  AGENDA: { href: '/agenda', title: 'Agenda e Tarefas', enabled: true, featureId: 'AGENDA' },
  PROCESSOS: { href: '/processos', title: 'Processos', enabled: true, featureId: 'PROCESSOS' },
  RANKING: { href: '/colaboradores', title: 'Ranking', enabled: true, featureId: 'RANKING' },
  INTEGRACOES: { href: '/integracoes', title: 'Integrações', enabled: true, featureId: 'INTEGRACOES' },
  SUPORTE: { href: '/suporte', title: 'Suporte', enabled: true, featureId: 'SUPORTE' },
  CONFIGURACOES: { href: '/configuracoes', title: 'Configurações', enabled: true, featureId: 'CONFIGURACOES' },
  SUPER_USER: { href: '/dashboard-development', title: 'Dashboard Development', enabled: true, featureId: 'SUPER_USER_DASHBOARD' },
}

/**
 * Check if user can access a specific page
 */
export function canAccessPage(
  href: string,
  userRole?: UserRole,
): boolean {
  const route = Object.values(PAGE_ROUTES).find((r) => r.href === href)
  if (!route) return false

  return isFeatureEnabled(route.featureId, userRole)
}

/**
 * Get pages available for a user
 */
export function getAvailablePages(userRole?: UserRole): PageRoute[] {
  return Object.values(PAGE_ROUTES).filter((route) =>
    isFeatureEnabled(route.featureId, userRole),
  )
}
