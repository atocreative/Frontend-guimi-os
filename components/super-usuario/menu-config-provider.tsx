"use client"

import React, { useState, useCallback, useEffect } from "react"
import {
  MenuConfigContext,
  type MenuConfigContextType,
  type MenuConfigItem,
  saveMenuConfigToStorage,
  loadMenuConfigFromStorage,
} from "@/lib/menu-config-context"

interface MenuConfigProviderProps {
  children: React.ReactNode
  initialItems?: MenuConfigItem[]
}

export function MenuConfigProvider({
  children,
  initialItems = [],
}: MenuConfigProviderProps) {
  const [items, setItemsState] = useState<MenuConfigItem[]>(initialItems)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>()

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadMenuConfigFromStorage()
    if (stored) {
      console.log("[MenuConfigProvider] Items carregados do localStorage:", {
        count: stored.length,
        items: stored.map(i => ({ id: i.id, name: i.name, enabled: i.enabled }))
      })
      setItemsState(stored)
      setLastUpdated(new Date())
    } else if (initialItems.length > 0) {
      console.log("[MenuConfigProvider] Usando initialItems do props:", {
        count: initialItems.length,
        items: initialItems.map(i => ({ id: i.id, name: i.name, enabled: i.enabled }))
      })
      setItemsState(initialItems)
      setLastUpdated(new Date())
    } else {
      console.warn("[MenuConfigProvider] Nenhum menu config carregado (localStorage vazio e initialItems vazio)")
    }
  }, [])

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
