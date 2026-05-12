"use client"

import { useMemo } from "react"
import { useSyncStatus } from "@/hooks/use-sync-status"
import { useIntegrationStatus } from "@/hooks/use-integration-status"
import { toast } from "sonner"
import { RefreshCw, CheckCircle2, AlertCircle, Plug, FileText, Database, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const INTEGRATIONS = [
  {
    id: "foneninja-api",
    name: "FoneNinja API",
    description: "Sincronização via API REST",
    icon: Plug,
    status: "conectado" as const,
    lastSync: "2 minutos atrás",
    dataTypes: ["Vendas", "Clientes", "Produtos"],
  },
  {
    id: "foneninja-xlsx",
    name: "FoneNinja XLSX",
    description: "Importação de planilhas",
    icon: FileText,
    status: "conectado" as const,
    lastSync: "1 dia atrás",
    dataTypes: ["Relatórios", "Dados históricos"],
  },
  {
    id: "banco-local",
    name: "Banco de Dados Local",
    description: "Sincronização com BD normalizado",
    icon: Database,
    status: "conectado" as const,
    lastSync: "Agora",
    dataTypes: ["Cache local", "Dados processados"],
  },
]

function formatDateTime(date?: Date) {
  if (!date) return "Nenhuma sincronização realizada"

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

function formatDuration(duration?: number) {
  if (!duration) return "—"
  return `${(duration / 1000).toFixed(1)}s`
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "sincronizando_historico":
      return "Sincronizando histórico"
    case "processando":
      return "Processando"
    case "concluido":
      return "Concluído"
    case "erro":
      return "Erro"
    default:
      return "Aguardando"
  }
}

export default function IntegracoesPpage() {
  const { state, isLoading, logs, lastSyncTime, sync } = useSyncStatus()
  const { status: integrationStatus } = useIntegrationStatus(15000)

  const handleSync = async () => {
    const ok = await sync()

    if (ok) {
      toast.success("Sincronização concluída com sucesso!")
    } else {
      toast.error("Erro ao sincronizar integrações")
    }
  }

  const latestLog = logs[0]
  const totalImported = useMemo(() => {
    if (integrationStatus.recordsProcessed) return integrationStatus.recordsProcessed
    return latestLog?.recordsProcessed ?? 0
  }, [integrationStatus.recordsProcessed, latestLog?.recordsProcessed])
  const totalRecords = useMemo(() => {
    if (integrationStatus.registrosTotal) return integrationStatus.registrosTotal
    return latestLog?.recordsTotal ?? totalImported
  }, [integrationStatus.registrosTotal, latestLog?.recordsTotal, totalImported])
  const progress = totalRecords > 0 ? Math.min((totalImported / totalRecords) * 100, 100) : 0
  const source = integrationStatus.source ?? "PostgreSQL"
  const cronStatus = integrationStatus.cronStatus ?? "ativo"
  const currentStatus = getStatusLabel(integrationStatus.status)
  const statusTone = integrationStatus.status === "erro" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">
          Gerenciar sincronização com sistemas externos
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle>Status de sincronização</CardTitle>
              <CardDescription>{formatDateTime(lastSyncTime)}</CardDescription>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge className={`gap-1 ${statusTone}`}>
                  {integrationStatus.status === "erro" ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  {currentStatus}
                </Badge>
                <Badge variant="outline">Origem principal: {source}</Badge>
                <Badge variant="outline">Cron: {cronStatus}</Badge>
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={isLoading}
              size="lg"
              variant={state === "error" ? "destructive" : "default"}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Sincronizando..." : "Sincronizar Agora"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">Total registros importados</p>
              <p className="mt-1 text-2xl font-semibold">{totalImported.toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">Registros processados</p>
              <p className="mt-1 text-2xl font-semibold">{(integrationStatus.recordsProcessed ?? latestLog?.recordsProcessed ?? 0).toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">Tempo</p>
              <p className="mt-1 text-2xl font-semibold">{formatDuration(latestLog?.duration)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso da importação histórica</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {isLoading && (
              <span className="inline-flex items-center gap-2 text-blue-600">
                <Clock className="h-4 w-4" />
                Sincronizando histórico
              </span>
            )}
            {!isLoading && integrationStatus.status === "concluido" && (
              <span className="inline-flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Dados históricos sincronizados
              </span>
            )}
            {integrationStatus.status === "erro" && (
              <span className="inline-flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                Erro na sincronização
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Integrações Disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {INTEGRATIONS.map((integration) => {
            const Icon = integration.icon
            return (
              <Card key={integration.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-lg bg-muted p-2">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {integration.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-xs text-green-800">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Conectado
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Última sincronização
                    </p>
                    <p className="text-sm">{integration.lastSync}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Dados sincronizados
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {integration.dataTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Sincronizações</CardTitle>
          <CardDescription>
            {logs.length > 0 ? `${logs.length} sincronização(ões) registrada(s)` : "Sem histórico"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma sincronização realizada ainda</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-1 items-center gap-3">
                    {log.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(log.timestamp)}
                        {log.duration && ` • ${formatDuration(log.duration)}`}
                        {(log.recordsProcessed || log.recordsTotal) &&
                          ` • ${log.recordsProcessed?.toLocaleString("pt-BR") ?? 0}/${log.recordsTotal?.toLocaleString("pt-BR") ?? 0}`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      log.status === "success"
                        ? "ml-2 bg-green-100 text-green-800"
                        : "ml-2 bg-red-100 text-red-800"
                    }
                  >
                    {log.status === "success" ? "Sucesso" : "Erro"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
