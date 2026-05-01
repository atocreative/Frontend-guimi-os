
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

import { getSnapshotFinanceiroServer } from "@/lib/backend-financeiro"
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

  // Fetch real data from backend
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const snapshot = await getSnapshotFinanceiroServer(month, year, accessToken).catch(() => null)

  // Use real data from snapshot when available
  const faturamentoMes = snapshot?.receita || snapshot?.totalReceitas || 0
  const despesasVariaveis = snapshot?.despesasVariaveis || snapshot?.variableExpenses || 0
  const despesasFixas = snapshot?.fixedExpensesTotal || snapshot?.fixedExpenses || 0
  const lucroBruto = snapshot?.grossProfit || 0
  const margemBruta = snapshot?.grossMargin || 0
  const lucroLiquido = snapshot?.netProfit || 0
  const vendasMes: any[] = []

  // Use real data from snapshot
  const metaMes = 100000 // Set target
  const percentualMeta = faturamentoMes > 0 ? Math.round((faturamentoMes / metaMes) * 100) : 0
  const totalDespesas = despesasFixas + despesasVariaveis
  const margemLiquida = faturamentoMes > 0 ? (lucroLiquido / faturamentoMes * 100) : 0
  const saldoCaixa = faturamentoMes - totalDespesas
  const contasPagarMes = despesasFixas * 0.3

  // Convert sales data to table format
  const entradas = vendasMes.map((venda, idx) => ({
    id: String(idx),
    produto: `Venda de ${venda.nomeVendedor}`,
    categoria: "Realizado",
    valorVenda: venda.faturamento,
    custo: venda.faturamento * (1 - venda.margemLucro / 100),
    lucro: venda.lucro,
    margem: venda.margemLucro,
    formaPagamento: "PIX",
    vendedor: venda.nomeVendedor,
    cliente: `Cliente ${idx + 1}`,
    data: new Date().toLocaleDateString("pt-BR"),
    foneNinjaId: null,
  }))

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold">Financeiro</h2>
        <p className="text-sm text-muted-foreground">
          KPIs mensais, registros recentes e fluxo de caixa.
        </p>
      </div>

      {faturamentoMes === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">⚠️ Dados indisponíveis</p>
          <p className="mt-1 text-xs">
            Não foi possível conectar à API do Fone Ninja. Verifique as variáveis de ambiente.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard
          titulo="Faturamento do Mês"
          valor={brl(faturamentoMes)}
          descricao={`${percentualMeta}% da meta de ${brl(metaMes)}`}
          icone={DollarSign}
          tendencia={percentualMeta > 100 ? "up" : "down"}
          destaque
        />
        <KpiCard
          titulo="Lucro Líquido"
          valor={brl(lucroLiquido)}
          descricao={`Margem líquida ${margemLiquida.toFixed(1)}%`}
          icone={TrendingUp}
          tendencia="up"
        />
        <KpiCard
          titulo="Lucro Bruto"
          valor={brl(lucroBruto)}
          descricao={`Margem bruta ${margemBruta.toFixed(1)}%`}
          icone={PiggyBank}
          tendencia="up"
        />
        <KpiCard
          titulo="Total Despesas"
          valor={brl(totalDespesas)}
          descricao={`Fixas ${brl(despesasFixas)} · Variáveis ${brl(despesasVariaveis)}`}
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
        <GraficoFluxoCaixa dados={[]} />
        <GraficoCategorias dados={[]} />
      </div>

      <TabelaEntradas entradas={entradas.length > 0 ? entradas : []} />
      <TabelaDespesas despesas={[]} />

    </div>
  )
}
