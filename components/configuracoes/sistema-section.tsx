"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface SystemStatus {
  environment: string
  version: string
  nodeVersion: string
  uptime: string
  timezone: string
  database: "online" | "offline"
  backend: "online" | "offline"
  empresa: string
  commit?: string | null
  branch?: string | null
  buildAt?: string | null
}

function envLabel(env: string) {
  if (env === "production" || env === "produção") return "Produção"
  if (env === "staging" || env === "homologação") return "Homologação"
  return "Local"
}

function envColor(env: string) {
  if (env === "production" || env === "produção") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
  if (env === "staging") return "bg-amber-500/10 text-amber-600 border-amber-500/20"
  return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
}

function statusBadge(v: "online" | "offline" | undefined) {
  return v === "online"
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    : "bg-red-500/10 text-red-600 border-red-500/20"
}

export function SistemaSection() {
  const [data, setData] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/system/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-md space-y-2">
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="max-w-md border-red-500/20">
        <CardContent className="py-6 text-sm text-muted-foreground">
          Não foi possível carregar informações do sistema.
        </CardContent>
      </Card>
    )
  }

  const rows = [
    { label: "Ambiente", value: envLabel(data.environment), badge: envColor(data.environment) },
    { label: "Versão", value: data.version },
    { label: "Empresa", value: data.empresa },
    { label: "Backend", value: data.backend === "online" ? "Online" : "Offline", badge: statusBadge(data.backend) },
    { label: "Banco de dados", value: data.database === "online" ? "Conectado" : "Offline", badge: statusBadge(data.database) },
    { label: "Node.js", value: data.nodeVersion },
    { label: "Uptime", value: data.uptime },
    { label: "Fuso horário", value: data.timezone },
    ...(data.branch ? [{ label: "Branch", value: data.branch }] : []),
    ...(data.commit ? [{ label: "Commit", value: data.commit.slice(0, 8) }] : []),
    ...(data.buildAt ? [{ label: "Build em", value: data.buildAt }] : []),
  ]

  return (
    <div className="max-w-md">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Sistema</CardTitle>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              Operacional
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between border-b py-1.5 last:border-0">
              <span className="text-xs text-muted-foreground">{row.label}</span>
              {row.badge ? (
                <Badge variant="outline" className={`text-xs ${row.badge}`}>{row.value}</Badge>
              ) : (
                <span className="text-xs font-medium">{row.value}</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
