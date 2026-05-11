"use client"

import { useCallback, useState } from "react"
import { AlertCircle, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MenuItemVisibilityControl } from "@/components/super-usuario/menu-item-visibility-control"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

interface DevMenuItem {
  id: string
  name: string
  description?: string
  enabled: boolean
  pending: boolean
  allowedRoles?: string[]
}

interface DeveloperMenuClientProps {
  initialMenu: DevMenuItem[]
}

export function DeveloperMenuClient({ initialMenu }: DeveloperMenuClientProps) {
  const [menu, setMenu] = useState<DevMenuItem[]>(initialMenu)
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState<Record<string, { enabled?: boolean; pending?: boolean }>>({})

  const handleStateChange = useCallback(
    async (itemId: string, state: "hidden" | "disabled" | "enabled") => {
      // Update local state
      const newEnabled = state === "enabled"
      const newPending = state === "disabled"

      setMenu((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, enabled: newEnabled, pending: newPending } : item
        )
      )

      // Track changes
      setChanges((prev) => ({
        ...prev,
        [itemId]: {
          enabled: newEnabled,
          pending: newPending,
        },
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    if (Object.keys(changes).length === 0) {
      toast.info("Nenhuma alteração para salvar")
      return
    }

    setSaving(true)
    try {
      const promises = Object.entries(changes).map(([itemId, state]) =>
        api.updateDevMenu(itemId, {
          enabled: state.enabled,
          pending: state.pending,
        })
      )

      await Promise.all(promises)
      toast.success("Alterações salvas com sucesso!")
      setChanges({})
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar alterações")
    } finally {
      setSaving(false)
    }
  }, [changes])

  return (
    <div className="space-y-4">
      {menu.length === 0 && (
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
        {menu.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    {item.pending && (
                      <Badge variant="coming-soon" className="text-xs">
                        EM BREVE
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {item.allowedRoles && item.allowedRoles.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {item.allowedRoles.join(", ")}
                    </Badge>
                  )}
                  <MenuItemVisibilityControl
                    itemId={item.id}
                    itemName={item.name}
                    initialState={
                      !item.enabled ? "hidden" : item.pending ? "disabled" : "enabled"
                    }
                    onSave={handleStateChange}
                    disableSaveButton={true}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {menu.length > 0 && (
        <div className="sticky bottom-0 flex justify-end gap-3 bg-background/95 backdrop-blur border-t px-6 py-4">
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
