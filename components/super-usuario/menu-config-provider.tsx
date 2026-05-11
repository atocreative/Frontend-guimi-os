"use client"

import React, { useState, useCallback, useEffect } from "react"
import {
  MenuConfigContext,
  type MenuConfigContextType,
  type MenuConfigItem,
  saveMenuConfigToStorage,
  loadMenuConfigFromStorage,
} from "@/lib/menu-config-context"
import { FEATURE_DEFINITIONS } from "@/lib/feature-definitions"

interface MenuConfigProviderProps {
  children: React.ReactNode
  initialItems?: MenuConfigItem[]
}

export function MenuConfigProvider({
  children,
  initialItems = [],
}: MenuConfigProviderProps) {
  const baseItems = React.useMemo<MenuConfigItem[]>(() => {
    if (initialItems.length > 0) {
      return initialItems
    }

    return FEATURE_DEFINITIONS.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      enabled: true,
      pending: false,
      allowedRoles: [] as ("COLABORADOR" | "GESTOR" | "ADMIN" | "SUPER_USER")[],
    }))
  }, [initialItems])

  const [items, setItemsState] = useState<MenuConfigItem[]>(baseItems)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>()

  // Single consolidated effect for initialization with API validation
  useEffect(() => {
    // Case 1: Server-provided items are authoritative
    if (initialItems.length > 0) {
      setItemsState(initialItems)
      setLastUpdated(new Date())
      return
    }

    // Case 2: Try to load from localStorage
    const stored = loadMenuConfigFromStorage()
    if (stored && stored.length > 0) {
      const storedMap = new Map(stored.map((item) => [item.id, item]))
      const merged = baseItems.map((baseItem) => {
        const storedItem = storedMap.get(baseItem.id)
        return storedItem ? { ...baseItem, ...storedItem } : baseItem
      })
      setItemsState(merged)
      setLastUpdated(new Date())
      return
    }

    // Case 3: Use default baseItems
    setItemsState(baseItems)
    setLastUpdated(new Date())
  }, [baseItems, initialItems.length])

  // Fetch from API in background to validate/update state if stale
  useEffect(() => {
    if (typeof window === "undefined") return // SSR guard

    const validateFromAPI = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/dev-menu", { cache: "no-store" })
        if (response.ok) {
          const apiItems = await response.json()
          // Merge API response with current state (prefer API if response is valid)
          if (Array.isArray(apiItems) && apiItems.length > 0) {
            const apiMap = new Map(apiItems.map((item: any) => [item.id, item]))
            const updated = items.map((item) =>
              apiMap.get(item.id) ? { ...item, ...apiMap.get(item.id) } : item
            )
            setItemsState(updated)
            saveMenuConfigToStorage(updated)
            setLastUpdated(new Date())
          }
        }
      } catch (error) {
        // Silent fail: keep current state if API is down
        console.debug("[MenuConfigProvider] API validation skipped:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Only validate after initial setup
    if (items.length > 0) {
      validateFromAPI()
    }
  }, []) // Run once on mount

  const setItems = useCallback((newItems: MenuConfigItem[]) => {
    setItemsState(newItems)
    setLastUpdated(new Date())
  }, [])

  const updateItem = useCallback(
    (id: string, updates: Partial<MenuConfigItem>) => {
      setItemsState((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
        const updatedItem = updated.find(i => i.id === id)
        if (updatedItem) {
          console.log("[MenuConfigProvider] Item atualizado:", {
            id,
            changes: updates,
            newState: { enabled: updatedItem.enabled, pending: updatedItem.pending, roles: updatedItem.allowedRoles }
          })
        }
        return updated
      })
      // Update timestamp on item change to track state mutations
      setLastUpdated(new Date())
    },
    []
  )

  const saveToStorage = useCallback(() => {
    try {
      saveMenuConfigToStorage(items)
      console.log("[MenuConfigProvider] Alterações salvas no localStorage:", {
        count: items.length,
        timestamp: new Date().toISOString(),
        items: items.map(i => ({ id: i.id, name: i.name, enabled: i.enabled, pending: i.pending }))
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error("[MenuConfigProvider] Erro ao salvar no localStorage:", error)
      throw error
    }
  }, [items])

  const value: MenuConfigContextType = {
    items,
    isLoading,
    lastUpdated,
    setItems,
    updateItem,
    saveToStorage,
    loadFromStorage: loadMenuConfigFromStorage,
  }

  return (
    <MenuConfigContext.Provider value={value}>
      {children}
    </MenuConfigContext.Provider>
  )
}
