"use client"

import { AlertTriangle, Info, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DashboardAlert } from "@/lib/services/dashboard-alerts"

interface Props {
  alerts: DashboardAlert[]
}

const SEVERITY_META = {
  critical: {
    icon: ShieldAlert,
    row: "border-red-500/40 bg-red-500/10",
    icon_cls: "text-red-500",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    label: "Crítico",
  },
  warning: {
    icon: AlertTriangle,
    row: "border-yellow-500/40 bg-yellow-500/10",
    icon_cls: "text-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    label: "Atenção",
  },
  info: {
    icon: Info,
    row: "border-blue-500/30 bg-blue-500/8",
    icon_cls: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    label: "Info",
  },
} as const

export function PainelAlertasGlobal({ alerts }: Props) {
  const critical = alerts.filter((a) => a.severity === "critical").length
  const warnings = alerts.filter((a) => a.severity === "warning").length

  // Sort: critical first, then warning, then info
  const sorted = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Alertas do Sistema</CardTitle>
          <div className="flex items-center gap-1.5">
            {critical > 0 && (
              <Badge
                variant="outline"
                className="h-5 px-1.5 text-[10px] font-semibold bg-red-500/20 text-red-400 border-red-500/30"
              >
                {critical} crítico{critical > 1 ? "s" : ""}
              </Badge>
            )}
            {warnings > 0 && (
              <Badge
                variant="outline"
                className="h-5 px-1.5 text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              >
                {warnings} atenção
              </Badge>
            )}
            {alerts.length === 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
                Nenhum
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <p className="px-4 pb-4 text-xs text-muted-foreground">Nenhum alerta ativo no momento.</p>
        ) : (
          <div className="max-h-[220px] overflow-y-auto px-4 pb-4 space-y-1.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {sorted.map((alert) => {
              const meta = SEVERITY_META[alert.severity]
              const Icon = meta.icon
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-3 py-2",
                    meta.row
                  )}
                >
                  <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", meta.icon_cls)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight">{alert.title}</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground mt-0.5">
                      {alert.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
