"use client"

import { AlertTriangle, Info, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DashboardAlert, AlertSource } from "@/lib/services/dashboard-alerts"

interface Props {
  alerts: DashboardAlert[]
}

const SEVERITY_META = {
  critical: {
    icon: ShieldAlert,
    card: "border-red-500/40 bg-red-500/8 dark:bg-red-500/10",
    icon_cls: "text-red-500",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    label: "Crítico",
  },
  warning: {
    icon: AlertTriangle,
    card: "border-yellow-500/40 bg-yellow-500/8 dark:bg-yellow-500/10",
    icon_cls: "text-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    label: "Atenção",
  },
  info: {
    icon: Info,
    card: "border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/8",
    icon_cls: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    label: "Info",
  },
} as const

const SOURCE_LABEL: Record<AlertSource, string> = {
  financeiro: "Financeiro",
  operacao: "Operação",
  tarefas: "Tarefas",
  vendas: "Comercial",
  ranking: "Ranking",
  integracao: "Integração",
}

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 } as const

export function PainelAlertasGlobal({ alerts }: Props) {
  if (alerts.length === 0) return null

  const critical = alerts.filter((a) => a.severity === "critical").length
  const warnings  = alerts.filter((a) => a.severity === "warning").length

  const sorted = [...alerts].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Central de Alertas</CardTitle>
          <div className="flex items-center gap-1.5">
            {critical > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-semibold bg-red-500/20 text-red-400 border-red-500/30">
                {critical} crítico{critical > 1 ? "s" : ""}
              </Badge>
            )}
            {warnings > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {warnings} atenção
              </Badge>
            )}
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
              {alerts.length} total
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((alert) => {
            const meta = SEVERITY_META[alert.severity]
            const Icon = meta.icon
            return (
              <div
                key={alert.id}
                title={alert.tooltip}
                className={cn(
                  "relative flex gap-3 rounded-lg border p-3 cursor-default",
                  meta.card
                )}
              >
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.icon_cls)} />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs font-semibold leading-tight">{alert.title}</p>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Badge variant="outline" className={cn("h-4 px-1 text-[9px] font-semibold", meta.badge)}>
                      {meta.label}
                    </Badge>
                    <Badge variant="outline" className="h-4 px-1 text-[9px] text-muted-foreground">
                      {SOURCE_LABEL[alert.source]}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
