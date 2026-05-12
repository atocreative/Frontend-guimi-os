"use client"

import { useSyncStatus } from "@/hooks/use-sync-status"
import { toast } from "sonner"
import { RefreshCw, CheckCircle2, AlertCircle, Plug, FileText, Database } from "lucide-react"
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

export default function IntegracoesPpage() {
  const { state, isLoading, logs, lastSyncTime, sync } = useSyncStatus()

  const handleSync = async () => {
    await sync()

    if (state === "success") {
      toast.success("Sincronização concluída com sucesso!")
    } else if (state === "error") {
      toast.error("Erro ao sincronizar integrações")
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">
          Gerenciar sincronização com sistemas externos
        </p>
      </div>

      {/* Status e Botão de Sincronização */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Status Geral de Sincronização</CardTitle>
              <CardDescription>
                {lastSyncTime
                  ? `Última sincronização: ${formatTime(lastSyncTime)}`
                  : "Nenhuma sincronização realizada"}
              </CardDescription>
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
          {/* Status de carregamento */}
          {isLoading && (
            <p className="text-sm text-blue-600 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              Sincronizando integrações...
            </p>
          )}

          {/* Status badge */}
          {state === "success" && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Sincronização concluída com sucesso</span>
            </div>
          )}

          {state === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Erro na sincronização. Tente novamente.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de Integrações */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Integrações Disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {INTEGRATIONS.map((integration) => {
            const Icon = integration.icon
            return (
              <Card key={integration.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 bg-muted rounded-lg">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {integration.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Última sincronização
                    </p>
                    <p className="text-sm">{integration.lastSync}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
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

      {/* Histórico de Sincronizações */}
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
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {log.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(log.timestamp)}
                        {log.duration && ` • ${(log.duration / 1000).toFixed(1)}s`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      log.status === "success"
                        ? "bg-green-100 text-green-800 ml-2"
                        : "bg-red-100 text-red-800 ml-2"
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
