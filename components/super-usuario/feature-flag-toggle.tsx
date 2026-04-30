"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"

interface FeatureFlagToggleProps {
  flagId: string
  initialEnabled: boolean
}

export function FeatureFlagToggle({ flagId, initialEnabled }: FeatureFlagToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    setEnabled(checked)

    try {
      // In the future, this could call an API endpoint to persist the flag
      // For now, it just updates local state
      // await fetch(`/api/feature-flags/${flagId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ enabled: checked }),
      // })
    } catch (error) {
      console.error("Failed to update feature flag:", error)
      setEnabled(!checked)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Switch
      checked={enabled}
      onCheckedChange={handleToggle}
      disabled={loading}
      className="data-[state=checked]:bg-green-600"
    />
  )
}
