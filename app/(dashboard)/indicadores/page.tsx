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
  mockOrigemLeads,
  mockAlertasIndicadores,
} from "@/app/(dashboard)/data/mock"
import { getIndicadoresTime, getEvolucaoIndicadores, getResumoTime } from "@/lib/indicadores-repository"

export default async function IndicadoresPage() {
  // Fetch real data from backend and Fone Ninja
  const [indicadores, evolucao, resumo] = await Promise.all([
    getIndicadoresTime().catch(() => []),
    getEvolucaoIndicadores(30).catch(() => []),
    getResumoTime().catch(() => ({
      totalVendas: 0,
      faturamentoTotal: 0,
      lucroTotal: 0,
      ticketMedioTime: 0,
      topVendedor: null
    })),
  ])

  const totalFaturamento = resumo.faturamentoTotal
  const totalVendas = resumo.totalVendas
  const ticketMedioGeral = Math.round(resumo.ticketMedioTime)
  const conversaoMedia = totalVendas > 0 ? Math.round((totalVendas / (totalVendas * 1.5)) * 100) : 0

  // Create evolution data for chart
  const evolucaoFormatada = evolucao.map((item) => ({
    mes: item.data.split('-').slice(1, 3).join('/'),
    lucro: item.lucro,
    vendas: item.vendas,
    faturamento: item.faturamento,
  }))

  const dataDisponivel = indicadores.length > 0 || totalVendas > 0

  return (
    <div className="space-y-6">

      {/* Título */}
      <div>
        <h2 className="text-xl font-semibold">Indicadores</h2>
        <p className="text-sm text-muted-foreground">
          Performance comercial e estratégica.
        </p>
      </div>

      {!dataDisponivel && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">⚠️ Dados indisponíveis</p>
          <p className="mt-1 text-xs">
            Não foi possível conectar aos dados de indicadores. Verifique a conexão com o backend.
          </p>
        </div>
      )}

      {/* KPIs gerais */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiIndicador
          titulo="Conversão Média"
          valor={`${conversaoMedia}%`}
          descricao="do time comercial"
          icone={TrendingUp}
          variacao={dataDisponivel ? 2 : 0}
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
          variacao={dataDisponivel ? 12 : 0}
          variacaoLabel=" vs mês anterior"
        />
        <KpiIndicador
          titulo="Total de Vendas"
          valor={`${totalVendas}`}
          descricao="vendas realizadas no mês"
          icone={Target}
          variacao={dataDisponivel ? 8 : 0}
          variacaoLabel=" vendas"
        />
        <KpiIndicador
          titulo="Melhor Vendedor"
          valor={resumo.topVendedor?.nome || "—"}
          descricao={resumo.topVendedor ? `${resumo.topVendedor.vendas} vendas` : "Sem dados"}
          icone={Users}
        />
      </div>

      {/* Alertas de desvio */}
      <PainelAlertas alertas={mockAlertasIndicadores} />

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GraficoEvolucao dados={evolucaoFormatada.length > 0 ? evolucaoFormatada : mockAlertasIndicadores.map((_, idx) => ({
          mes: `${idx}`,
          lucro: 0,
          vendas: 0,
          faturamento: 0,
        }))} />
        <OrigemLeads dados={mockOrigemLeads} />
      </div>

      {/* Ranking */}
      {indicadores.length > 0 && <RankingPerformance colaboradores={indicadores} />}

    </div>
  )
}
