/**
 * Feature Flag Manager - In-memory storage for feature flag toggles
 * This will be replaced with server-side persistence in the future
 */

import { FEATURE_FLAGS, type FeatureFlag } from "@/lib/feature-flags"

interface FlagState {
  [key: string]: boolean
}

// In-memory storage for flag overrides (in production, this should be in a database)
let flagOverrides: FlagState = {}

/**
 * Initialize flag manager from stored state
 */
export function initializeFlagManager() {
  // In production, this would load from a database or persistent storage
  // For now, we start with all flags at their default state
  flagOverrides = {}
}

/**
 * Get the current state of a feature flag
 */
export function getFlagState(flagId: string): boolean {
  const flag = Object.values(FEATURE_FLAGS).find((f) => f.id === flagId)
  if (!flag) return false

  // If there's an override, use it; otherwise use the default
  if (flagId in flagOverrides) {
    return flagOverrides[flagId]
  }

  return flag.enabled
}

/**
 * Toggle a feature flag
 */
export function toggleFeatureFlag(flagId: string, enabled: boolean): boolean {
  // Validate that this is a real flag
  const flag = Object.values(FEATURE_FLAGS).find((f) => f.id === flagId)
  if (!flag) {
    throw new Error(`Unknown feature flag: ${flagId}`)
  }

  flagOverrides[flagId] = enabled
  return enabled
}

/**
 * Reset a feature flag to its default state
 */
export function resetFeatureFlag(flagId: string): boolean {
  const flag = Object.values(FEATURE_FLAGS).find((f) => f.id === flagId)
  if (!flag) {
    throw new Error(`Unknown feature flag: ${flagId}`)
  }

  delete flagOverrides[flagId]
  return flag.enabled
}

/**
 * Get all flag overrides
 */
export function getAllFlagOverrides(): FlagState {
  return { ...flagOverrides }
}

/**
 * Reset all flag overrides to defaults
 */
export function resetAllFlags(): void {
  flagOverrides = {}
}

/**
 * Get current state of all flags
 */
export function getAllFlagStates(): Record<string, boolean> {
  const states: Record<string, boolean> = {}

  Object.values(FEATURE_FLAGS).forEach((flag) => {
    states[flag.id] = getFlagState(flag.id)
  })

  return states
}
