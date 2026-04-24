"use client"

import { Phone, Clock, Flame } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Lead } from "@/app/(dashboard)/comercial/data/mock"

const temperaturaCor = {
  QUENTE: "bg-red-500/10 text-red-600 border-red-500/20",
  MORNO: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  FRIO: "bg-blue-500/10 text-blue-600 border-blue-500/20",
}

const temperaturaLabel = {
  QUENTE: "Quente",
  MORNO: "Morno",
  FRIO: "Frio",
}

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor)
}

export function LeadCard({ lead }: { lead: Lead }) {
  const atrasado = lead.diasParado >= 3

  return (
    <Card className={cn(
      "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
      atrasado && "border-red-500/30"
    )}>
      <CardContent className="p-3 space-y-2">
        
        {/* Nome e temperatura */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight">{lead.nome}</p>
          <Badge
            variant="outline"
            className={cn("text-xs px-1.5 py-0 shrink-0", temperaturaCor[lead.temperatura])}
          >
            {temperaturaLabel[lead.temperatura]}
          </Badge>
        </div>

        {/* Produto e valor */}
        <div>
          <p className="text-xs text-muted-foreground">{lead.produto}</p>
          <p className="text-sm font-bold text-emerald-600">{brl(lead.valor)}</p>
        </div>

        {/* Origem */}
        <p className="text-xs text-muted-foreground">
          via {lead.origem}
        </p>

        {/* Rodapé */}
        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{lead.ultimoContato}</span>
          </div>
          {atrasado && (
            <span className="text-xs text-red-500 font-medium">
              {lead.diasParado}d parado
            </span>
          )}
          {lead.proximoFollowUp && !atrasado && (
            <span className="text-xs text-amber-600 font-medium">
              Follow: {lead.proximoFollowUp}
            </span>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
