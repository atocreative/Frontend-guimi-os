import {
  TrendingUp,
  Target,
  DollarSign,
  Users,
} from "lucide-react"
import { KpiIndicador } from "@/components/indicadores/kpi-indicador"
import { RankingPerformance } from "@/components/indicadores/ranking-performance"
import { GraficoEvolucao } from "@/components/indicadores/grafico-evolucao"
import { OrigemLeads } from "@/components/indicadores/origem-leads"
import { PainelAlertas } from "@/components/dashboard/painel-alertas"
import {
  mockIndicadoresTime,
  mockEvolucaoIndicadores,
  mockOrigemLeads,
  mockAlertasIndicadores,
} from "@/app/(dashboard)/data/mock"

export default function IndicadoresPage() {
  const totalFaturamento = mockIndicadoresTime.reduce(
    (acc, c) => acc + c.faturamentoMes, 0
  )
  const totalVendas = mockIndicadoresTime.reduce(
    (acc, c) => acc + c.vendasMes, 0
  )
  const ticketMedioGeral = Math.round(totalFaturamento / totalVendas)
  const conversaoMedia = Math.round(
    mockIndicadoresTime.reduce((acc, c) => acc + c.taxaConversao, 0) /
      mockIndicadoresTime.length
  )

  return (
    <div className="space-y-6">

      {/* Título */}
      <div>
        <h2 className="text-xl font-semibold">Indicadores</h2>
        <p className="text-sm text-muted-foreground">
          Performance comercial e estratégica.
        </p>
      </div>

      {/* KPIs gerais */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiIndicador
          titulo="Conversão Média"
          valor={`${conversaoMedia}%`}
          descricao="do time comercial"
          icone={TrendingUp}
          variacao={-2}
          variacaoLabel="pp"
        />
        <KpiIndicador
          titulo="Ticket Médio Geral"
          valor={new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
          }).format(ticketMedioGeral)}
          descricao="por venda no mês"
          icone={DollarSign}
          variacao={75}
          variacaoLabel=" vs fev"
        />
        <KpiIndicador
          titulo="Total de Vendas"
          valor={`${totalVendas}`}
          descricao="vendas realizadas no mês"
          icone={Target}
          variacao={5}
          variacaoLabel=" vendas"
        />
        <KpiIndicador
          titulo="Melhor Canal"
          valor="Indicação"
          descricao="50% de conversão"
          icone={Users}
        />
      </div>

      {/* Alertas de desvio */}
      <PainelAlertas alertas={mockAlertasIndicadores} />

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GraficoEvolucao dados={mockEvolucaoIndicadores} />
        <OrigemLeads dados={mockOrigemLeads} />
      </div>

      {/* Ranking */}
      <RankingPerformance colaboradores={mockIndicadoresTime} />

    </div>
  )
}
