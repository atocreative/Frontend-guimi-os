import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { IntegracaoConfig } from "@/app/(dashboard)/configuracoes/data/mock"

const statusConfig = {
  CONECTADO: {
    cor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icone: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    label: "Conectado",
  },
  DESCONECTADO: {
    cor: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
    icone: <XCircle className="h-4 w-4 text-zinc-400" />,
    label: "Desconectado",
  },
  ERRO: {
    cor: "bg-red-500/10 text-red-600 border-red-500/20",
    icone: <AlertCircle className="h-4 w-4 text-red-500" />,
    label: "Erro",
  },
  PENDENTE: {
    cor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icone: <Clock className="h-4 w-4 text-amber-500" />,
    label: "Não configurado",
  },
}

export function IntegracaoCard({ integracao }: { integracao: IntegracaoConfig }) {
  const config = statusConfig[integracao.status]

  return (
    <Card className={cn(
      integracao.status === "ERRO" && "border-red-500/30"
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {integracao.logo ? (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src={integracao.logo}
                  alt={integracao.nome}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {integracao.icone}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">{integracao.nome}</p>
              <p className="text-xs text-muted-foreground">
                {integracao.descricao}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-xs shrink-0", config.cor)}>
            {config.label}
          </Badge>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Última sincronização</p>
            <p className="text-xs font-medium mt-0.5">
              {integracao.ultimaSincronizacao ?? "Nunca sincronizado"}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Registros importados</p>
            <p className="text-xs font-medium mt-0.5">
              {integracao.registrosImportados > 0
                ? integracao.registrosImportados.toLocaleString("pt-BR")
                : "—"}
            </p>
          </div>
        </div>

        {/* Fonte */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            Alimenta: <span className="font-medium">{integracao.fonte}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            disabled={integracao.status === "PENDENTE"}
          >
            <RefreshCw className="h-3 w-3" />
            {integracao.status === "PENDENTE" ? "Configurar" : "Sincronizar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
