import { MetricasComercial } from "@/components/comercial/metricas-comercial"
import { PipelineColuna } from "@/components/comercial/pipeline-coluna"
import { mockLeads, mockMetricas, etapas } from "./data/mock"

export default function ComercialPage() {
  return (
    <div className="space-y-6">

      {/* Título */}
      <div>
        <h2 className="text-xl font-semibold">Comercial</h2>
        <p className="text-sm text-muted-foreground">
          Integração de dados via Kommo CRM
        </p>
      </div>

      {/* Métricas */}
      <MetricasComercial metricas={mockMetricas} />

      {/* Pipeline Kanban */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Pipeline</h3>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {etapas.map((etapa) => (
              <PipelineColuna
                key={etapa.key}
                label={etapa.label}
                cor={etapa.cor}
                leads={mockLeads.filter((l) => l.etapa === etapa.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Follow-ups Urgentes */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          Atenção Necessária
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            leads parados há 3+ dias ou sem follow-up agendado
          </span>
        </h3>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Lead
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Produto
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Valor
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Último Contato
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {mockLeads
                .filter((l) => l.diasParado >= 3 || !l.proximoFollowUp)
                .filter((l) => l.etapa !== "fechado_ganho" && l.etapa !== "fechado_perdido")
                .map((lead, i, arr) => (
                  <tr
                    key={lead.id}
                    className={i < arr.length - 1 ? "border-b" : ""}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{lead.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.telefone}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {lead.produto}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-emerald-600">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        maximumFractionDigits: 0,
                      }).format(lead.valor)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {lead.ultimoContato}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-red-500">
                        {lead.diasParado >= 3
                          ? `${lead.diasParado}d sem contato`
                          : "Sem follow-up"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
