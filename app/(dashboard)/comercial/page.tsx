import { Clock, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MetricasComercial } from "@/components/comercial/metricas-comercial"
import { LeadCard } from "@/components/comercial/lead-card"
import { getComercialDashboard, getComercialLeads, getComercialConversations, getKommoStatus } from "@/lib/services/comercial-service"
import { mockLeads } from "./data/mock"

export default async function ComercialPage() {
  const [dashboard, leads, conversas, kommoStatus] = await Promise.all([
    getComercialDashboard(),
    getComercialLeads(),
    getComercialConversations(),
    getKommoStatus(),
  ]).catch(() => [null, null, null, null])

  const metricas = dashboard?.metricas || {
    leadsAtivos: 0,
    leadsSemFollowUp: 0,
    taxaConversao: 0,
    volumePipeline: 0,
  }

  const leadsData = leads || mockLeads
  const lastSync = dashboard?.lastSync || new Date().toISOString()

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
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Sincronizado com Kommo
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(lastSync).toLocaleTimeString('pt-BR')}
        </span>
      </div>

      {/* Métricas */}
      <MetricasComercial metricas={metricas} />

      {/* Leads por temperatura */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Leads Prioritários</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {leadsData.slice(0, 9).map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
        {leadsData.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhum lead disponível</p>
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

      {/* Conversas abertas */}
      {conversas && conversas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Conversas Ativas</h3>
          <p className="text-sm text-muted-foreground">
            {conversas.length} conversa(s) ativa(s)
          </p>
        </div>
      )}
    </div>
  )
}
