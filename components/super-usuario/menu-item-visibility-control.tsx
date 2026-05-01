"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type VisibilityState = "hidden" | "disabled" | "enabled"

interface MenuItemVisibilityControlProps {
  itemId: string
  itemName: string
  initialState: VisibilityState
  onSave?: (itemId: string, state: VisibilityState) => Promise<void>
  disableSaveButton?: boolean
}

export function MenuItemVisibilityControl({
  itemId,
  itemName,
  initialState,
  onSave,
  disableSaveButton = false,
}: MenuItemVisibilityControlProps) {
  const [state, setState] = useState<VisibilityState>(initialState)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasChanged = state !== initialState

  const handleSave = async () => {
    if (!hasChanged) return

    setLoading(true)
    try {
      if (onSave) {
        await onSave(itemId, state)
      }
      setSaved(true)
      // Reset saved indicator after 2 seconds
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Failed to save visibility state:", error)
      setState(initialState)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Select value={state} onValueChange={(value) => setState(value as VisibilityState)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hidden">
            <span>Ocultar</span>
          </SelectItem>
          <SelectItem value="disabled">
            <span>Visível • Em breve</span>
          </SelectItem>
          <SelectItem value="enabled">
            <span>Ativo</span>
          </SelectItem>
        </SelectContent>
      </Select>

      {!disableSaveButton && (
        <Button
          onClick={handleSave}
          disabled={!hasChanged || loading}
          size="sm"
          variant={saved ? "default" : "outline"}
          className={saved ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {loading ? "Salvando..." : saved ? "Salvo" : "Salvar"}
        </Button>
      )}
    </div>
  )
}
