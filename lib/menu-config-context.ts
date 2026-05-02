/**
 * Menu Configuration Context
 * Manages global state for dev menu configuration with localStorage persistence
 */

import { createContext, useContext } from "react"

export interface MenuConfigItem {
  id: string
  name: string
  description?: string
  enabled: boolean
  pending: boolean
  allowedRoles?: ("COLABORADOR" | "GESTOR" | "ADMIN" | "SUPER_USER")[]
}

export interface MenuConfigContextType {
  items: MenuConfigItem[]
  isLoading: boolean
  lastUpdated?: Date
  setItems: (items: MenuConfigItem[]) => void
  updateItem: (id: string, updates: Partial<MenuConfigItem>) => void
  saveToStorage: () => void
  loadFromStorage: () => MenuConfigItem[] | null
}

export const MenuConfigContext = createContext<MenuConfigContextType | undefined>(
  undefined
)

const STORAGE_KEY = "dev-menu-config"

/**
 * Save menu config to localStorage
 */
export function saveMenuConfigToStorage(items: MenuConfigItem[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items,
        lastUpdated: new Date().toISOString(),
      })
    )
  } catch (error) {
    console.error("Failed to save menu config to localStorage:", error)
  }
}

/**
 * Load menu config from localStorage
 */
export function loadMenuConfigFromStorage(): MenuConfigItem[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    return parsed.items || null
  } catch (error) {
    console.error("Failed to load menu config from localStorage:", error)
    return null
  }
}

/**
 * Clear menu config from localStorage
 */
export function clearMenuConfigFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear menu config from localStorage:", error)
  }
}

/**
 * Hook to use menu config context
 */
export function useMenuConfig(): MenuConfigContextType {
  const context = useContext(MenuConfigContext)
  if (context === undefined) {
    throw new Error("useMenuConfig must be used within MenuConfigProvider")
  }
  return context
}
