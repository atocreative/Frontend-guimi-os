"use client"

import { useCallback, useState, useEffect } from "react"
import { AlertCircle, Save, RotateCcw, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api-client"
import { useMenuConfig, type MenuConfigItem } from "@/lib/menu-config-context"
import { toast } from "sonner"

const ROLES = ["COLABORADOR", "GESTOR", "ADMIN", "SUPER_USER"] as const
type Role = typeof ROLES[number]

interface DeveloperMenuEnhancedProps {
  initialMenu: MenuConfigItem[]
  isSuperUser?: boolean
}

export function DeveloperMenuEnhanced({
  initialMenu,
  isSuperUser = false,
}: DeveloperMenuEnhancedProps) {
  const { items, setItems, updateItem, saveToStorage } = useMenuConfig()
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState<Record<string, boolean>>({})
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Initialize from prop if context is empty
  useEffect(() => {
    if (items.length === 0 && initialMenu.length > 0) {
      setItems(initialMenu)
    }
  }, [initialMenu, items.length, setItems])

  const handleStateChange = useCallback(
    (itemId: string, state: "hidden" | "disabled" | "enabled") => {
      const enabled = state === "enabled"
      const pending = state === "disabled"

      updateItem(itemId, { enabled, pending })
      setChanges((prev) => ({ ...prev, [itemId]: true }))
    },
    [updateItem]
  )

  const handleRoleToggle = useCallback(
    (itemId: string, role: Role) => {
      const item = items.find((i) => i.id === itemId)
      if (!item) return

      const roles = item.allowedRoles || []
      const newRoles = roles.includes(role)
        ? roles.filter((r) => r !== role)
        : [...roles, role]

      updateItem(itemId, { allowedRoles: newRoles })
      setChanges((prev) => ({ ...prev, [itemId]: true }))
    },
    [items, updateItem]
  )

  const handleSave = useCallback(async () => {
    if (Object.keys(changes).length === 0) {
      toast.info("Nenhuma alteração para salvar")
      return
    }

    setSaving(true)
    try {
      // Save locally
      saveToStorage()

      // Save to backend
      const promises = Object.keys(changes).map((itemId) => {
        const item = items.find((i) => i.id === itemId)
        if (!item) return Promise.resolve()

        return api.updateDevMenu(itemId, {
          enabled: item.enabled,
          pending: item.pending,
        })
      })

      await Promise.all(promises)
      toast.success("Alterações salvas com sucesso!")
      setChanges({})
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar alterações")
    } finally {
      setSaving(false)
    }
  }, [changes, items, saveToStorage])

  const handleReset = useCallback(() => {
    setItems(initialMenu)
    setChanges({})
    toast.info("Configurações restauradas")
  }, [initialMenu, setItems])

  const getItemStatus = (item: MenuConfigItem) => {
    if (!item.enabled) return "hidden"
    if (item.pending) return "disabled"
    return "enabled"
  }

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Nenhum item de menu disponível</p>
                <p className="text-sm text-amber-800 mt-1">
                  Verifique a conexão com o backend em http://localhost:3001
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {items.map((item) => {
          const status = getItemStatus(item)
          const isHidden = status === "hidden"
          const isDisabled = status === "disabled"
          const isChanged = changes[item.id]

          return (
            <Card
              key={item.id}
              className={`transition-all ${
                isHidden && isSuperUser ? "border-red-300 bg-red-50/50" : ""
              } ${isChanged ? "ring-2 ring-blue-500" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      {isHidden && isSuperUser && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <EyeOff className="h-3 w-3" />
                          OCULTO
                        </Badge>
                      )}
                      {isDisabled && (
                        <Badge variant="secondary" className="text-xs">
                          EM BREVE
                        </Badge>
                      )}
                      {isChanged && (
                        <Badge className="text-xs bg-blue-500">ALTERADO</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Select
                      value={status}
                      onValueChange={(value) =>
                        handleStateChange(item.id, value as any)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hidden">
                          <span className="flex items-center gap-2">
                            <EyeOff className="h-4 w-4" />
                            Ocultar
                          </span>
                        </SelectItem>
                        <SelectItem value="disabled">
                          <span>Em breve</span>
                        </SelectItem>
                        <SelectItem value="enabled">
                          <span className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Ativo
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 border-t pt-4">
                <div>
                  <p className="text-sm font-medium mb-3">
                    Visível para roles:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map((role) => (
                      <div key={role} className="flex items-center gap-2">
                        <Checkbox
                          id={`${item.id}-${role}`}
                          checked={
                            item.allowedRoles?.includes(role) ?? false
                          }
                          onCheckedChange={() =>
                            handleRoleToggle(item.id, role)
                          }
                          disabled={!isChanged && Object.keys(changes).length > 0}
                        />
                        <Label
                          htmlFor={`${item.id}-${role}`}
                          className="font-normal cursor-pointer text-sm"
                        >
                          {role}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {items.length > 0 && (
        <div className="sticky bottom-0 flex justify-between gap-3 bg-background/95 backdrop-blur border-t px-6 py-4 rounded-lg">
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={Object.keys(changes).length === 0 || saving}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar
          </Button>
          <Button
            onClick={handleSave}
            disabled={Object.keys(changes).length === 0 || saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      )}
    </div>
  )
}
