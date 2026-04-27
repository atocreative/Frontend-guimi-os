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

      {/* Aguardando integração com backend */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">⏳ Aguardando dados</p>
        <p className="mt-1 text-xs">
          A integração com o CRM Kommo será disponibilizada após configuração no backend.
          No momento, esta tela mostra dados mockados apenas para referência de layout.
        </p>
      </div>

      {/* Placeholder para Métricas */}
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">Métricas comerciais (indisponíveis)</p>
      </div>

      {/* Placeholder para Pipeline */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Pipeline</h3>
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">Pipeline de vendas (indisponível)</p>
        </div>
      </div>

      {/* Placeholder para Urgentes */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Atenção Necessária</h3>
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">Leads em foco (indisponíveis)</p>
        </div>
      </div>
    </div>
  )
}
