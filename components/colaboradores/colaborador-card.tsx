import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Mail, Phone } from "lucide-react"
import { NivelBadge } from "./nivel-badge"
import { cn } from "@/lib/utils"
import type { ColaboradorResumo } from "@/types/colaboradores"

const roleCor: Record<string, string> = {
  ADMIN: "bg-primary text-primary-foreground border-primary",
  GESTOR: "bg-secondary/10 text-secondary border-secondary/20",
  COLABORADOR: "bg-muted text-muted-foreground border-muted",
}

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  GESTOR: "Gestor",
  COLABORADOR: "Colaborador",
}

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor)
}

export function ColaboradorCard({ colaborador }: { colaborador: ColaboradorResumo }) {
  const percentualMeta =
    colaborador.metaMes > 0
      ? Math.round((colaborador.realizadoMes / colaborador.metaMes) * 100)
      : 0

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback
              className={cn(
                "text-lg font-bold",
                colaborador.role === "ADMIN"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {colaborador.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold">{colaborador.nome}</p>
              <Badge
                variant="outline"
                className={cn("px-1.5 text-xs", roleCor[colaborador.role])}
              >
                {roleLabel[colaborador.role]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{colaborador.cargo}</p>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{colaborador.tempoEmpresa}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{colaborador.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{colaborador.telefone}</span>
          </div>
        </div>

        <div className="space-y-1.5 rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Meta do mês</span>
            <span
              className={cn(
                "text-xs font-bold",
                percentualMeta >= 100
                  ? "text-emerald-500"
                  : percentualMeta >= 80
                    ? "text-amber-500"
                    : "text-rose-500"
              )}
            >
              {percentualMeta}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                percentualMeta >= 100
                  ? "bg-emerald-500"
                  : percentualMeta >= 80
                    ? "bg-amber-500"
                    : "bg-rose-500"
              )}
              style={{ width: `${Math.min(percentualMeta, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{colaborador.realizadoMes} itens</span>
            <span>de {colaborador.metaMes}</span>
          </div>
        </div>

        <NivelBadge
          nivel={colaborador.nivel}
          pontos={colaborador.pontosMes}
          progresso={colaborador.nivelProgresso}
          sequencia={colaborador.sequenciaDias}
        />
      </CardContent>
    </Card>
  )
}
