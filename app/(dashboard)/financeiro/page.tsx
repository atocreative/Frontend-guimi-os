
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  PiggyBank,
} from "lucide-react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { TabelaEntradas } from "@/components/financeiro/tabela-entradas"
import { TabelaDespesas } from "@/components/financeiro/tabela-despesas"
import { GraficoFluxoCaixa } from "@/components/financeiro/grafico-fluxo-caixa"
import { GraficoCategorias } from "@/components/financeiro/grafico-categorias"
import { Card, CardContent } from "@/components/ui/card"
import {
  mockFinanceiro,
  mockEntradas,
  mockDespesas,
  mockFluxoCaixa,
  mockCategoriasDespesa,
} from "@/app/(dashboard)/data/mock"


function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor)
}

export default function FinanceiroPage() {
  const f = mockFinanceiro

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold">Financeiro</h2>
        <p className="text-sm text-muted-foreground">
          KPIs mensais, registros recentes e fluxo de caixa.
        </p>
      </div>

      {/* Aviso: Dados mockados aguardando integração */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">⚠️ Dados de referência</p>
        <p className="mt-1 text-xs">
          Esta seção exibe dados mockados para fins de layout e design.
          A integração com dados reais do backend será implementada após configuração das APIs financeiras.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard
          titulo="Faturamento do Mês"
          valor={brl(f.faturamentoMes)}
          descricao={`${f.percentualMeta}% da meta de ${brl(f.metaMes)}`}
          icone={DollarSign}
          tendencia="up"
          destaque
        />
        <KpiCard
          titulo="Lucro Líquido"
          valor={brl(f.lucroLiquido)}
          descricao={`Margem líquida ${f.margemLiquida}%`}
          icone={TrendingUp}
          tendencia="up"
        />
        <KpiCard
          titulo="Lucro Bruto"
          valor={brl(f.lucroBruto)}
          descricao={`Margem bruta ${f.margemBruta}%`}
          icone={PiggyBank}
          tendencia="up"
        />
        <KpiCard
          titulo="Total Despesas"
          valor={brl(f.totalDespesas)}
          descricao={`Fixas ${brl(f.despesasFixas)} · Variáveis ${brl(f.despesasVariaveis)}`}
          icone={Receipt}
          tendencia="down"
        />
        <KpiCard
          titulo="Saldo em Caixa"
          valor={brl(f.saldoCaixa)}
          descricao="Posição atual"
          icone={Wallet}
          tendencia="neutral"
        />
        <KpiCard
          titulo="A Pagar este mês"
          valor={brl(f.contasPagarMes)}
          descricao="Despesas pendentes"
          icone={TrendingDown}
          tendencia="down"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GraficoFluxoCaixa dados={mockFluxoCaixa} />
        <GraficoCategorias dados={mockCategoriasDespesa} />
      </div>

      <TabelaEntradas entradas={mockEntradas} />
      <TabelaDespesas despesas={mockDespesas} />

    </div>
  )
}
