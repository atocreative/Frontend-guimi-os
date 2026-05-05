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

  useEffect(() => {
    setItemsState(baseItems)
  }, [baseItems])

  // Keep server-provided items authoritative on initial dashboard load.
  useEffect(() => {
    if (initialItems.length > 0) {
      setLastUpdated(new Date())
      return
    }

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

    setLastUpdated(new Date())
  }, [baseItems, initialItems.length])

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
