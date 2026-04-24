import { Badge } from "@/components/ui/badge"
import { LeadCard } from "./lead-card"
import { cn } from "@/lib/utils"
import type { Lead } from "@/app/(dashboard)/comercial/data/mock"

interface PipelineColunaProps {
  label: string
  cor: string
  leads: Lead[]
}

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(valor)
}

export function PipelineColuna({ label, cor, leads }: PipelineColunaProps) {
  const total = leads.reduce((acc, l) => acc + l.valor, 0)

  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      
      {/* Header da coluna */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", cor)} />
          <span className="text-xs font-semibold">{label}</span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {leads.length}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {brl(total)}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {leads.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-xs text-muted-foreground">Sem leads</p>
          </div>
        ) : (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        )}
      </div>

    </div>
  )
}
