/**
 * Hook to check if a menu item should be visible for a user
 */

import { useMenuConfig, type MenuConfigItem } from "@/lib/menu-config-context"

interface MenuVisibilityOptions {
  itemId: string
  userRole?: string
}

export function useMenuVisibility({ itemId, userRole }: MenuVisibilityOptions) {
  const { items } = useMenuConfig()

  const item = items.find((i) => i.id === itemId)
  if (!item) {
    return {
      isVisible: true,
      isEnabled: true,
      isPending: false,
      hasAccess: true,
    }
  }

  const isVisible = item.enabled
  const isPending = item.pending && item.enabled
  const hasAccess =
    !item.allowedRoles ||
    item.allowedRoles.length === 0 ||
    (userRole && item.allowedRoles.includes(userRole as any))

  return {
    isVisible,
    isEnabled: item.enabled && !item.pending,
    isPending,
    hasAccess,
    shouldDisplay: isVisible && hasAccess,
    statusLabel:
      !isVisible ? "oculto" :
      isPending ? "em breve" :
      !hasAccess ? "acesso restrito" :
      "ativo",
  }
}

/**
 * Check if a menu item is accessible for a specific role
 */
export function canAccessMenuItem(item: MenuConfigItem, userRole?: string): boolean {
  if (!item.enabled) return false
  if (!userRole) return true
  if (!item.allowedRoles || item.allowedRoles.length === 0) return true

  return item.allowedRoles.includes(userRole as any)
}

/**
 * Filter menu items based on user role and visibility
 */
export function filterMenuItems(
  items: MenuConfigItem[],
  userRole?: string
): MenuConfigItem[] {
  return items.filter((item) => {
    if (!item.enabled) return false
    return canAccessMenuItem(item, userRole)
  })
}
