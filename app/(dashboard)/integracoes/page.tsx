"use client"

import { useState } from "react"
import { Activity, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SyncStatus {
  source: string
  status: "conectado" | "desconectado" | "sincronizando" | "erro"
  ultimaSincronizacao?: string
  proximaSincronizacao?: string
}

export default function IntegracoesPpage() {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([
    { source: "FoneNinja", status: "conectado", ultimaSincronizacao: "Há 5 minutos" },
    { source: "BD Local", status: "conectado", ultimaSincronizacao: "Há 2 minutos" },
  ])
  const [isSyncing, setIsSyncing] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "conectado":
        return "bg-green-100 text-green-800"
      case "sincronizando":
        return "bg-blue-100 text-blue-800"
      case "desconectado":
        return "bg-yellow-100 text-yellow-800"
      case "erro":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "conectado":
        return <CheckCircle2 className="h-4 w-4" />
      case "sincronizando":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case "desconectado":
      case "erro":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncStatuses((prev) =>
      prev.map((s) => ({ ...s, status: "sincronizando" }))
    )

    try {
      // Simular call to sync endpoint (será implementado no backend)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSyncStatuses([
        { source: "FoneNinja", status: "conectado", ultimaSincronizacao: "Agora" },
        { source: "BD Local", status: "conectado", ultimaSincronizacao: "Agora" },
      ])

      toast.success("Sincronização concluída com sucesso!")
    } catch (error) {
      setSyncStatuses((prev) =>
        prev.map((s) => ({ ...s, status: "erro" }))
      )
      toast.error("Erro ao sincronizar integrações")
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">
          Gerenciar sincronização com sistemas externos
        </p>
      </div>

      {/* Botão de sincronização rápida */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Status de Sincronização</h2>
          <p className="text-sm text-muted-foreground">
            Verifique o status das suas integrações
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          variant="default"
          size="lg"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
        </Button>
      </div>

      {/* Grid de integrações */}
      <div className="grid gap-4 md:grid-cols-2">
        {syncStatuses.map((sync) => (
          <Card key={sync.source}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">{sync.source}</CardTitle>
                <CardDescription>Sistema de integração</CardDescription>
              </div>
              <Badge className={getStatusColor(sync.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(sync.status)}
                  <span className="capitalize">{sync.status}</span>
                </span>
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sync.ultimaSincronizacao && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Última sincronização
                    </p>
                    <p className="text-sm">{sync.ultimaSincronizacao}</p>
                  </div>
                )}
                {sync.proximaSincronizacao && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Próxima sincronização
                    </p>
                    <p className="text-sm">{sync.proximaSincronizacao}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Dados sincronizados
                  </p>
                  <p className="text-sm">
                    {sync.source === "FoneNinja"
                      ? "Vendas, clientes, produtos"
                      : "BD normalizado, cache local"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seção de logs (opcional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Sincronizações</CardTitle>
          <CardDescription>
            Últimas 5 tentativas de sincronização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>11/05/2026 21:26 - Sincronização automática</span>
              <Badge className="bg-green-100 text-green-800">Sucesso</Badge>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>11/05/2026 20:26 - Sincronização automática</span>
              <Badge className="bg-green-100 text-green-800">Sucesso</Badge>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>11/05/2026 19:26 - Sincronização automática</span>
              <Badge className="bg-green-100 text-green-800">Sucesso</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
