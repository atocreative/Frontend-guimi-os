
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

import { getFinanceiroSummaryServer } from "@/lib/backend-financeiro"
import { getSessionAccessToken } from "@/lib/backend-api"
import { getSession } from "@/lib/auth-session"

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor)
}

export default async function FinanceiroPage() {
  const session = await getSession()
  const accessToken = getSessionAccessToken(session)

  // Backend retorna tudo calculado e formatado
  const summary = await getFinanceiroSummaryServer(accessToken).catch(() => null)

  console.log("[FRONT FINANCEIRO] summary recebido:", summary)

  // Validação de dados críticos
  if (!summary || !summary?.resumo) {
    console.warn("[FRONT FINANCEIRO] Dados indisponíveis ou resumo vazio")
  }

  // KPIs vêm do resumo calculado pelo backend — sempre com fallback
  const faturamentoMes = Number(summary?.resumo?.faturamentoMes ?? 0)
  const despesasMes = Number(summary?.resumo?.despesasMes ?? 0)
  const lucroLiquidoMes = Number(summary?.resumo?.lucroLiquidoMes ?? 0)
  const quantidadeVendas = Number(summary?.resumo?.totalVendas ?? 0)

  // Gráfico vem pronto do backend — array vazio se indisponível
  const fluxoCaixa = Array.isArray(summary?.grafico) ? summary.grafico : []

  // Vendas para tabela — array vazio se indisponível
  const vendasMes = Array.isArray(summary?.data) ? summary.data : []

  // Categorias de despesas — derivadas do resumo
  const categorias =
    despesasMes > 0
      ? [{ categoria: "Despesas", valor: despesasMes, percentual: 100 }]
      : []

  // Cálculos auxiliares para KPI cards — sempre com validação
  const margemLiquida = faturamentoMes > 0 ? (lucroLiquidoMes / faturamentoMes * 100) : 0
  const saldoCaixa = Math.max(0, faturamentoMes - despesasMes)
  const contasPagarMes = despesasMes * 0.3

  // Determinar se há dados válidos
  const temDados = summary !== null && (faturamentoMes > 0 || quantidadeVendas > 0 || fluxoCaixa.length > 0)

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold">Financeiro</h2>
        <p className="text-sm text-muted-foreground">
          KPIs mensais, registros recentes e fluxo de caixa.
        </p>
      </div>

      {!summary && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">⚠️ Aguardando dados...</p>
          <p className="mt-1 text-xs">
            Conectando à API. Por favor, aguarde...
          </p>
        </div>
      )}

      {summary && !temDados && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">⚠️ Nenhum dado disponível</p>
          <p className="mt-1 text-xs">
            Não há vendas ou dados no período. Verifique a API do Fone Ninja.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard
          titulo="Faturamento do Mês"
          valor={brl(faturamentoMes)}
          descricao={`${quantidadeVendas} vendas`}
          icone={DollarSign}
          tendencia={faturamentoMes > 0 ? "up" : "down"}
          destaque
        />
        <KpiCard
          titulo="Lucro Líquido"
          valor={brl(lucroLiquidoMes)}
          descricao={`Margem líquida ${margemLiquida.toFixed(1)}%`}
          icone={TrendingUp}
          tendencia={lucroLiquidoMes > 0 ? "up" : "down"}
        />
        <KpiCard
          titulo="Total Despesas"
          valor={brl(despesasMes)}
          descricao="Do período"
          icone={Receipt}
          tendencia="down"
        />
        <KpiCard
          titulo="Saldo em Caixa"
          valor={brl(saldoCaixa)}
          descricao="Posição atual"
          icone={Wallet}
          tendencia={saldoCaixa > 0 ? "up" : "down"}
        />
        <KpiCard
          titulo="A Pagar este mês"
          valor={brl(contasPagarMes)}
          descricao="Despesas pendentes"
          icone={TrendingDown}
          tendencia="down"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GraficoFluxoCaixa dados={fluxoCaixa} />
        <GraficoCategorias dados={categorias} />
      </div>

      <TabelaEntradas entradas={vendasMes} />
      <TabelaDespesas despesas={[]} />

    </div>
  )
}
