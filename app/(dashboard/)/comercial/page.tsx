import { Clock, CheckCircle2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricasComercial } from '@/components/comercial/metricas-comercial'
import { ComercialKpis } from '@/components/comercial/comercial-kpis'
import { TabelaLeads } from '@/components/comercial/tabela-leads'
import { GraficoOrigem } from '@/components/comercial/grafico-origem'
import { PipelineColuna } from '@/components/comercial/pipeline-coluna'
import { getComercialDashboard, getComercialLeads, getComercialConversations, getKommoStatus } from '@/lib/services/comercial-service'
import { mockLeads, etapas } from './data/mock'

export default async function ComercialPage() {
  const [dashboard, leads, conversas, kommoStatus] = await Promise.all([
    getComercialDashboard(),
    getComercialLeads(),
    getComercialConversations(),
    getKommoStatus(),
  ]).catch(() => [null, null, null, null])

  const leadsData = leads || mockLeads
  const metricas = dashboard?.metricas || {
    leadsAtivos: leadsData.filter(
      (l) => l.etapa !== 'fechado_ganho' && l.etapa !== 'fechado_perdido'
    ).length,
    leadsSemFollowUp: leadsData.filter((l) => !l.proximoFollowUp && l.diasParado >= 3).length,
    taxaConversao: leadsData.length > 0
      ? Math.round((leadsData.filter((l) => l.etapa === 'fechado_ganho').length / leadsData.length) * 100)
      : 0,
    volumePipeline: leadsData.reduce((acc, l) => acc + l.valor, 0),
  }

  const lastSync = dashboard?.lastSync || new Date().toISOString()

  // Agrupar leads por etapa para pipeline
  const leadsPorEtapa = etapas.map((etapa) => ({
    ...etapa,
    leads: leadsData.filter((l) => l.etapa === etapa.key),
  }))

  // Chats sem resposta (simulado)
  const chatsSemResposta = leadsData.filter((l) => l.diasParado >= 3 && l.etapa !== 'fechado_ganho' && l.etapa !== 'fechado_perdido').slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold">Comercial</h2>
        <p className="text-sm text-muted-foreground">
          Dashboard de vendas e gestão de leads via Kommo CRM
        </p>
      </div>

      {/* Status sync + Botão Kommo */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Sincronizado com Kommo
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(lastSync).toLocaleTimeString('pt-BR')}
          </span>
        </div>
        <Button variant="outline" className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Abrir Kommo
        </Button>
      </div>

      {/* KPIs Comercial */}
      <ComercialKpis leads={leadsData} />

      {/* Métricas Antigos */}
      <MetricasComercial metricas={metricas} />

      {/* Pipeline Kanban */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Pipeline de Vendas</h3>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {leadsPorEtapa.map((col) => (
              <PipelineColuna key={col.key} label={col.label} cor={col.cor} leads={col.leads} />
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Tabela + Gráfico Origem */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tabela de Leads */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Todos os Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <TabelaLeads leads={leadsData} filtro="ativos" />
            </CardContent>
          </Card>
        </div>

        {/* Gráfico Origem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Origem dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoOrigem leads={leadsData} />
          </CardContent>
        </Card>
      </div>

      {/* Chats sem Resposta */}
      {chatsSemResposta.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-base text-amber-900">
              ⚠️ Chats Sem Resposta ({chatsSemResposta.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chatsSemResposta.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3">
                  <div>
                    <p className="font-medium text-sm">{lead.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.ultimoContato} • {lead.diasParado} dias parado
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Responder
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversas Ativas */}
      {conversas && conversas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {conversas.length} conversa(s) ativa(s)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
