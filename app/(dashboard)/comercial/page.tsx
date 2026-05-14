import { Clock, CheckCircle2, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MetricasComercial } from "@/components/comercial/metricas-comercial"
import { LeadCard } from "@/components/comercial/lead-card"
import { getComercialLeads } from "@/lib/services/comercial-service"

function calcularMetricas(leads: any[]) {
  if (!leads || leads.length === 0) return null

  const totalLeads = leads.length
  const leadsAtivos = leads.filter((l) => l.etapa !== "fechado_ganho" && l.etapa !== "fechado_perdido").length
  const leadsSemFollowUp = leads.filter((l) => !l.proximoFollowUp && (l.diasParado || 0) >= 3).length
  const leadsGanhos = leads.filter((l) => l.etapa === "fechado_ganho").length
  const taxaConversao = totalLeads > 0 ? Math.round((leadsGanhos / totalLeads) * 100) : 0
  const ticketMedio = totalLeads > 0 ? Math.round(leads.reduce((acc, l) => acc + (l.valor || 0), 0) / totalLeads) : 0
  const volumePipeline = leads.reduce((acc, l) => acc + (l.valor || 0), 0)

  return {
    totalLeads,
    leadsAtivos,
    leadsSemFollowUp,
    taxaConversao,
    ticketMedio,
    volumePipeline,
    leadsPorEtapa: {
      novo_contato: leads.filter((l) => l.etapa === "novo_contato").length,
      em_negociacao: leads.filter((l) => l.etapa === "em_negociacao").length,
      proposta_enviada: leads.filter((l) => l.etapa === "proposta_enviada").length,
      fechado_ganho: leadsGanhos,
      fechado_perdido: leads.filter((l) => l.etapa === "fechado_perdido").length,
    },
  }
}

export default async function ComercialPage() {
  const leads = await getComercialLeads().catch(() => null)
  const metricas = leads ? calcularMetricas(leads) : null
  const lastSync = new Date().toISOString()
  const hasError = !leads

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-xl font-semibold">Comercial</h2>
        <p className="text-sm text-muted-foreground">
          Dashboard de vendas e gestão de leads via Kommo CRM
        </p>
      </div>

      {/* Status sync badge */}
      <div className="flex items-center gap-2">
        {!hasError ? (
          <>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Sincronizado com Kommo
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(lastSync).toLocaleTimeString('pt-BR')}
            </span>
          </>
        ) : (
          <Badge variant="outline" className="bg-amber-50 text-amber-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Dados indisponíveis
          </Badge>
        )}
      </div>

      {/* Métricas */}
      {metricas && <MetricasComercial metricas={metricas} />}

      {/* Leads por temperatura */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Leads Prioritários</h3>
        {!hasError && leads && leads.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {leads.slice(0, 9).map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {hasError ? "Não foi possível carregar os leads. Verifique a conexão com o backend." : "Nenhum lead disponível"}
            </p>
          </div>
        )}
      </div>

      {/* Pipeline */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Pipeline de Vendas</h3>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Pipeline em desenvolvimento - aguardando integração completa
          </p>
        </div>
      </div>

    </div>
  )
}
