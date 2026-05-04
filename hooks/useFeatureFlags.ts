import useSWR from "swr"
import { normalizeDevMenuItems } from "@/lib/feature-definitions"
import type { MenuConfigItem } from "@/lib/menu-config-context"

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

export function useFeatureFlags() {
  const { data, error, isLoading, mutate } = useSWR<MenuConfigItem[]>(
    "/api/dev-menu",
    fetcher,
    { revalidateOnFocus: false }
  )

  // Fallback to FEATURE_DEFINITIONS defaults so UI is never empty
  const features: MenuConfigItem[] = data && data.length > 0
    ? data
    : normalizeDevMenuItems([])

  return {
    features,
    isLoading,
    isError: !!error,
    refresh: mutate,
  }
}

export function isFeatureEnabled(
  features: MenuConfigItem[],
  featureId: string,
  userRole?: string
): boolean {
  const feature = features.find(
    (f) => f.id === featureId.toLowerCase() ||
           f.id === featureId
  )

  if (!feature) return true
  if (!feature.enabled) return false
  if (feature.allowedRoles && feature.allowedRoles.length > 0 && userRole) {
    return feature.allowedRoles.includes(userRole as any)
  }

  return true
}
