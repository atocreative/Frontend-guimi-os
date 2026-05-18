"use client"

import { useMemo } from "react"
import { useSyncStatus } from "@/hooks/use-sync-status"
import { useIntegrationStatus } from "@/hooks/use-integration-status"
import { toast } from "sonner"
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IntegracaoCard } from "@/components/configuracoes/integracao-card"
import type { IntegracaoConfig } from "@/app/(dashboard)/configuracoes/data/mock"

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
    case "sincronizando_historico": return "Sincronizando histórico"
    case "processando": return "Processando"
    case "concluido": return "Concluído"
    case "erro": return "Erro"
    default: return "Aguardando"
  }
}

export function IntegracoesSection() {
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
  const statusTone = integrationStatus.status === "erro"
    ? "bg-red-500/10 text-red-600 border-red-500/20"
    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"

  const foneOnline = integrationStatus.foneninjaStatus === "online"
  const kommoOnline = integrationStatus.kommoStatus === "online"
  const meuAssessorOnline = integrationStatus.meuAssessorStatus === "online"
  const lastSyncStr = integrationStatus.lastSync
    ? new Date(integrationStatus.lastSync).toLocaleString("pt-BR")
    : null

  const integracoes: IntegracaoConfig[] = useMemo(() => [
    {
      id: "kommo",
      nome: "Kommo CRM",
      descricao: "Leads, pipeline e atividades comerciais",
      status: kommoOnline ? "CONECTADO" : "DESCONECTADO",
      ultimaSincronizacao: lastSyncStr,
      registrosImportados: 0,
      icone: "K",
      logo: "/kommo.png",
      fonte: "Comercial",
    },
    {
      id: "fone-ninja",
      nome: "Fone Ninja",
      descricao: "Vendas, entradas e produtos",
      status: foneOnline ? "CONECTADO" : "DESCONECTADO",
      ultimaSincronizacao: lastSyncStr,
      registrosImportados: totalImported,
      icone: "F",
      logo: "/fone-ninja.png",
      fonte: "Financeiro",
    },
    {
      id: "meu-assessor",
      nome: "Meu Assessor",
      descricao: "Despesas, saídas e contas a pagar",
      status: meuAssessorOnline ? "CONECTADO" : "DESCONECTADO",
      ultimaSincronizacao: lastSyncStr,
      registrosImportados: 0,
      icone: "M",
      logo: "/assessor.png",
      fonte: "Financeiro",
    },
  ], [foneOnline, kommoOnline, meuAssessorOnline, lastSyncStr, totalImported])

  return (
    <div className="space-y-4">
      {/* Sync status card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-base">Status de sincronização</CardTitle>
              <CardDescription suppressHydrationWarning>{formatDateTime(lastSyncTime)}</CardDescription>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className={statusTone}>
                  {integrationStatus.status === "erro"
                    ? <AlertCircle className="h-3 w-3 mr-1" />
                    : <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {currentStatus}
                </Badge>
                <Badge variant="outline" className="text-xs">Origem: {source}</Badge>
                <Badge variant="outline" className="text-xs">Cron: {cronStatus}</Badge>
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={isLoading}
              size="sm"
              variant={state === "error" ? "destructive" : "default"}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Sincronizando..." : "Sincronizar Agora"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Registros importados</p>
              <p className="mt-1 text-xl font-semibold">{totalImported.toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-lg border bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Registros processados</p>
              <p className="mt-1 text-xl font-semibold">
                {(integrationStatus.recordsProcessed ?? latestLog?.recordsProcessed ?? 0).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Duração</p>
              <p className="mt-1 text-xl font-semibold">{formatDuration(latestLog?.duration)}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso da importação histórica</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {isLoading && (
              <span className="inline-flex items-center gap-1.5 text-blue-600">
                <Clock className="h-3.5 w-3.5" />
                Sincronizando histórico
              </span>
            )}
            {!isLoading && integrationStatus.status === "concluido" && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Dados históricos sincronizados
              </span>
            )}
            {integrationStatus.status === "erro" && (
              <span className="inline-flex items-center gap-1.5 text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                Erro na sincronização
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integration cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Conectores e APIs</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integracoes.map((integracao) => (
            <IntegracaoCard key={integracao.id} integracao={integracao} />
          ))}
        </div>
      </div>

      {/* Sync logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Histórico de Sincronizações</CardTitle>
          <CardDescription className="text-xs">
            {logs.length > 0 ? `${logs.length} sincronização(ões) registrada(s)` : "Sem histórico"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma sincronização realizada ainda</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-1 items-center gap-3">
                    {log.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{log.message}</p>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {formatDateTime(log.timestamp)}
                        {log.duration && ` • ${formatDuration(log.duration)}`}
                        {(log.recordsProcessed || log.recordsTotal) &&
                          ` • ${log.recordsProcessed?.toLocaleString("pt-BR") ?? 0}/${log.recordsTotal?.toLocaleString("pt-BR") ?? 0}`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={log.status === "success"
                      ? "ml-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                      : "ml-2 bg-red-500/10 text-red-600 border-red-500/20 text-xs"}
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
