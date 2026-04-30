/**
 * Feature Flag Provider
 * Client-side context for managing feature flags
 */

import { useCallback, useState } from 'react'
import { FEATURE_FLAGS, FeatureFlag, UserRole, isFeatureEnabled } from './feature-flags'

export interface FeatureFlagContextType {
  flags: Record<string, FeatureFlag>
  isEnabled: (featureName: string, userRole?: UserRole) => boolean
  getFlag: (featureName: string) => FeatureFlag | undefined
  toggleFlag: (featureName: string) => void
}

export function useFeatureFlags(userRole?: UserRole): FeatureFlagContextType {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>(FEATURE_FLAGS)

  const isEnabled = useCallback(
    (featureName: string, role?: UserRole) => {
      const roleToUse = role ?? userRole
      return isFeatureEnabled(featureName, roleToUse)
    },
    [userRole],
  )

  const getFlag = useCallback((featureName: string) => {
    return flags[featureName]
  }, [flags])

  const toggleFlag = useCallback((featureName: string) => {
    setFlags((prev) => ({
      ...prev,
      [featureName]: {
        ...prev[featureName],
        enabled: !prev[featureName].enabled,
      },
    }))
  }, [])

  return {
    flags,
    isEnabled,
    getFlag,
    toggleFlag,
  }
}

/**
 * Server-side feature flag checker
 * Use this in Server Components and Server Actions
 */
export async function getServerFeatureFlags(userRole?: UserRole) {
  return {
    flags: FEATURE_FLAGS,
    isEnabled: (featureName: string) => isFeatureEnabled(featureName, userRole),
  }
}
