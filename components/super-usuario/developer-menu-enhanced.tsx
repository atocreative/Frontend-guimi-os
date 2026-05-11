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
import { FEATURE_DEFINITIONS } from "@/lib/feature-definitions"
import { toast } from "sonner"

const ROLES = ["COLABORADOR", "GESTOR", "ADMIN", "SUPER_USER"] as const
type Role = typeof ROLES[number]

// Map id → featureId for API calls
const ID_TO_FEATURE_ID = new Map(
  FEATURE_DEFINITIONS.map((d) => [d.id, d.featureId])
)

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

  useEffect(() => {
    if (initialMenu.length === 0) return
    if (items.length === 0) {
      setItems(initialMenu)
      return
    }
    // If context is missing items (stale localStorage), fill gaps from server data
    if (items.length < initialMenu.length) {
      const itemMap = new Map(items.map(i => [i.id, i]))
      const merged = initialMenu.map(s => itemMap.get(s.id) ?? s)
      setItems(merged)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStateChange = useCallback(
    (itemId: string, state: "hidden" | "disabled" | "enabled") => {
      updateItem(itemId, {
        enabled: state === "enabled",
        pending: state === "disabled",
      })
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
      saveToStorage()

      const promises = Object.keys(changes).map((itemId) => {
        const item = items.find((i) => i.id === itemId)
        if (!item) return Promise.resolve()

        // Use featureId for the API endpoint (e.g. COMERCIAL, not comercial)
        const featureId = ID_TO_FEATURE_ID.get(itemId) ?? itemId.toUpperCase()

        return api.updateDevMenu(featureId, {
          enabled: item.enabled,
          pending: item.pending,
          allowedRoles: item.allowedRoles,
        }).catch((err) => {
          console.error(`Erro ao salvar ${featureId}:`, err)
          // continue saving others even if one fails
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
              className={[
                "transition-all",
                isHidden && isSuperUser ? "border-red-300 bg-red-50/50" : "",
                isChanged ? "ring-2 ring-blue-500" : "",
              ].filter(Boolean).join(" ")}
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
                        <Badge variant="coming-soon" className="text-xs">EM BREVE</Badge>
                      )}
                      {isChanged && (
                        <Badge className="text-xs bg-blue-500">ALTERADO</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>

                  <Select
                    value={status}
                    onValueChange={(value) => handleStateChange(item.id, value as any)}
                  >
                    <SelectTrigger className="w-40 flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hidden">
                        <span className="flex items-center gap-2">
                          <EyeOff className="h-4 w-4" />
                          Ocultar
                        </span>
                      </SelectItem>
                      <SelectItem value="disabled">Em breve</SelectItem>
                      <SelectItem value="enabled">
                        <span className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Ativo
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 border-t pt-4">
                <p className="text-sm font-medium">
                  Visível para roles: <span className="text-muted-foreground font-normal">(vazio = todos)</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((role) => (
                    <div key={role} className="flex items-center gap-2">
                      <Checkbox
                        id={`${item.id}-${role}`}
                        checked={item.allowedRoles?.includes(role) ?? false}
                        onCheckedChange={() => handleRoleToggle(item.id, role)}
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
