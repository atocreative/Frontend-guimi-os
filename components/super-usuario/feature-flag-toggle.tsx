"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface FeatureFlagToggleProps {
  flagId: string
  initialEnabled: boolean
}

export function FeatureFlagToggle({ flagId, initialEnabled }: FeatureFlagToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    const newState = !enabled
    setEnabled(newState)

    try {
      // In the future, this could call an API endpoint to persist the flag
      // For now, it just updates local state
      // await fetch(`/api/feature-flags/${flagId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ enabled: newState }),
      // })
    } catch (error) {
      console.error("Failed to update feature flag:", error)
      setEnabled(!newState)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      variant={enabled ? "default" : "outline"}
      size="sm"
      className={enabled ? "bg-green-600 hover:bg-green-700" : ""}
    >
      {loading ? "..." : enabled ? "Ativado" : "Desativado"}
    </Button>
  )
}
