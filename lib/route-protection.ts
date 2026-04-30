/**
 * Route Protection - Middleware para proteger acesso a páginas baseado em feature flags
 */

import { getSession } from "@/lib/auth-session"
import { isFeatureEnabled, type UserRole } from "@/lib/feature-flags"
import { redirect } from "next/navigation"

export interface ProtectedPageConfig {
  featureId: string
  requiredRole?: UserRole
}

/**
 * Protege acesso a uma página baseado em feature flags
 * Se feature desabilitada, redireciona para /access-denied
 */
export async function protectPage(config: ProtectedPageConfig) {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  const userRole = session.user.role as UserRole

  // Verifica se feature está habilitada para o usuário
  if (!isFeatureEnabled(config.featureId, userRole)) {
    redirect("/access-denied")
  }

  return {
    user: session.user,
    role: userRole,
  }
}

/**
 * Verifica se usuário tem acesso a uma página
 */
export async function canAccessPage(featureId: string): Promise<boolean> {
  const session = await getSession()

  if (!session?.user) {
    return false
  }

  const userRole = session.user.role as UserRole
  return isFeatureEnabled(featureId, userRole)
}

/**
 * Verifica se usuário é super usuário/desenvolvedor
 */
export async function isSuperUser(): Promise<boolean> {
  const session = await getSession()

  if (!session?.user) {
    return false
  }

  return session.user.email === "admin@guimicell.com"
}
