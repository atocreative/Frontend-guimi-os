"use client"

import { Leaderboard } from "@/components/gamificacao/leaderboard"

interface PodioDashboardProps {
  currentUserId?: string
}

export function PodioDashboard({ currentUserId }: PodioDashboardProps) {
  return <Leaderboard currentUserId={currentUserId} compact />
}
