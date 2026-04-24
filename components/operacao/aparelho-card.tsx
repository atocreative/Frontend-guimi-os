import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Aparelho } from "@/app/(dashboard)/operacao/data/mock"

const statusCor: Record<string, string> = {
  DISPONIVEL: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  RESERVADO: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  AGUARDANDO_RETIRADA: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  EM_AVALIACAO: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  AVALIADO: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
}

const statusLabel: Record<string, string> = {
  DISPONIVEL: "Disponível",
  RESERVADO: "Reservado",
  AGUARDANDO_RETIRADA: "Aguard. Retirada",
  EM_AVALIACAO: "Em Avaliação",
  AVALIADO: "Avaliado",
}

const tipoCor: Record<string, string> = {
  NOVO: "bg-zinc-900 text-white",
  SEMINOVO: "bg-zinc-100 text-zinc-800",
  TRADE_IN: "bg-purple-500/10 text-purple-600",
}

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor)
}

export function AparelhoCard({ aparelho }: { aparelho: Aparelho }) {
  const margem = aparelho.custo && aparelho.preco
    ? (((aparelho.preco - aparelho.custo) / aparelho.preco) * 100).toFixed(1)
    : null

  return (
    <div className={cn(
      "rounded-lg border px-4 py-3 space-y-2 transition-all hover:shadow-sm",
      aparelho.status === "AGUARDANDO_RETIRADA" && "border-blue-500/30 bg-blue-500/5"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {aparelho.modelo} {aparelho.capacidade}
          </p>
          <p className="text-xs text-muted-foreground">{aparelho.cor}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className={cn("text-xs px-1.5", tipoCor[aparelho.tipo])}>
            {aparelho.tipo === "NOVO" ? "Novo" : aparelho.tipo === "SEMINOVO" ? "Seminovo" : "Trade-in"}
          </Badge>
          <Badge variant="outline" className={cn("text-xs px-1.5", statusCor[aparelho.status])}>
            {statusLabel[aparelho.status]}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {aparelho.preco > 0 && (
            <p className="text-sm font-bold text-emerald-600">{brl(aparelho.preco)}</p>
          )}
          {margem && (
            <p className="text-xs text-muted-foreground">Margem {margem}%</p>
          )}
        </div>
        <div className="text-right">
          {aparelho.cliente && (
            <p className="text-xs font-medium">{aparelho.cliente}</p>
          )}
          {aparelho.imei && (
            <p className="text-xs text-muted-foreground">IMEI {aparelho.imei}</p>
          )}
        </div>
      </div>

      {aparelho.observacao && (
        <p className="text-xs text-muted-foreground border-t pt-2">
          {aparelho.observacao}
        </p>
      )}
    </div>
  )
}
