import { Users, AlertTriangle, TrendingUp, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { mockMetricas } from "@/app/(dashboard)/comercial/data/mock"

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(valor)
}

type Metricas = typeof mockMetricas

export function MetricasComercial({ metricas }: { metricas: Metricas }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Leads Ativos</p>
            <p className="text-xl font-bold">{metricas.leadsAtivos}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-red-500/10 p-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sem Follow-up</p>
            <p className="text-xl font-bold text-red-500">
              {metricas.leadsSemFollowUp}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Conversão</p>
            <p className="text-xl font-bold">{metricas.taxaConversao}%</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volume Pipeline</p>
            <p className="text-xl font-bold">{brl(metricas.volumePipeline)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
