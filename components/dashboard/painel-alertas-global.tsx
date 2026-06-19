"use client"

import { AlertTriangle, Info, ShieldAlert, TriangleAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DashboardAlert, AlertSource, AlertSeverity } from "@/lib/services/dashboard-alerts"

interface Props {
  alerts: DashboardAlert[]
}

const SEVERITY_META: Record<AlertSeverity, {
  icon: React.ElementType
  card: string
  icon_cls: string
  badge: string
  label: string
  dot: string
}> = {
  critical: {
    icon: ShieldAlert,
    card: "border-red-500/40 bg-red-500/8 dark:bg-red-500/10",
    icon_cls: "text-red-500",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    label: "Crítico",
    dot: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    card: "border-orange-500/40 bg-orange-500/8 dark:bg-orange-500/10",
    icon_cls: "text-orange-500",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    label: "Alto",
    dot: "bg-orange-500",
  },
  medium: {
    icon: TriangleAlert,
    card: "border-yellow-500/40 bg-yellow-500/8 dark:bg-yellow-500/10",
    icon_cls: "text-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    label: "Médio",
    dot: "bg-yellow-500",
  },
  info: {
    icon: Info,
    card: "border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/8",
    icon_cls: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    label: "Informativo",
    dot: "bg-blue-400",
  },
}

const SOURCE_LABEL: Record<AlertSource, string> = {
  financeiro: "Financeiro",
  operacao: "Operação",
  tarefas: "Tarefas",
  vendas: "Comercial",
  ranking: "Ranking",
  integracao: "Integração",
}

export function PainelAlertasGlobal({ alerts }: Props) {
  if (alerts.length === 0) return null

  const critical = alerts.filter((a) => a.severity === "critical").length
  const alto     = alerts.filter((a) => a.severity === "warning").length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Central Executiva</CardTitle>
          <div className="flex items-center gap-1.5">
            {critical > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-semibold bg-red-500/20 text-red-400 border-red-500/30">
                {critical} crítico{critical > 1 ? "s" : ""}
              </Badge>
            )}
            {alto > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-semibold bg-orange-500/20 text-orange-400 border-orange-500/30">
                {alto} alto{alto > 1 ? "s" : ""}
              </Badge>
            )}
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
              {alerts.length} total
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => {
            const meta = SEVERITY_META[alert.severity] ?? SEVERITY_META.info
            const Icon = meta.icon
            return (
              <div
                key={alert.id}
                title={alert.tooltip}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 cursor-default",
                  meta.card
                )}
              >
                {/* severity dot */}
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.icon_cls)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                    <p className="text-xs font-semibold leading-tight">{alert.title}</p>
                    <Badge variant="outline" className={cn("h-4 px-1.5 text-[9px] font-semibold shrink-0", meta.badge)}>
                      {meta.label}
                    </Badge>
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-muted-foreground shrink-0">
                      {SOURCE_LABEL[alert.source]}
                    </Badge>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {alert.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
