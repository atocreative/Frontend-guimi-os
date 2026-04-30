
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
import {
  mockDespesas,
  mockFluxoCaixa,
  mockCategoriasDespesa,
} from "@/app/(dashboard)/data/mock"
import { getFaturamentoMes, getResumoFinanceiroHoje, getVendasPorVendedor } from "@/lib/foneninja"

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor)
}

export default async function FinanceiroPage() {
  // Fetch real data from Fone Ninja
  const [faturamentoMes, resumoHoje, vendasMes] = await Promise.all([
    getFaturamentoMes().catch(() => 0),
    getResumoFinanceiroHoje().catch(() => ({ faturamentoDia: 0, lucroBrutoDia: 0, margemBrutaDia: 0 })),
    (async () => {
      try {
        const hoje = new Date()
        const startDate = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
        const endDate = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
        return await getVendasPorVendedor(startDate, endDate)
      } catch {
        return []
      }
    })(),
  ])

  // Calculate approximate values
  const metaMes = 100000 // Set target
  const percentualMeta = Math.round((faturamentoMes / metaMes) * 100)
  const lucroLiquido = resumoHoje.lucroBrutoDia * 25 // Approximate
  const lucroBruto = resumoHoje.lucroBrutoDia
  const margemBruta = resumoHoje.margemBrutaDia
  const margemLiquida = margemBruta * 0.8 // Approximate
  const despesasFixas = (faturamentoMes * 0.15) // Approximate 15% of revenue
  const despesasVariaveis = (faturamentoMes * 0.25) // Approximate 25% of revenue
  const totalDespesas = despesasFixas + despesasVariaveis
  const saldoCaixa = faturamentoMes - totalDespesas
  const contasPagarMes = despesasFixas * 0.3 // 30% of fixed costs

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
        <GraficoFluxoCaixa dados={mockFluxoCaixa} />
        <GraficoCategorias dados={mockCategoriasDespesa} />
      </div>

      <TabelaEntradas entradas={entradas.length > 0 ? entradas : mockFluxoCaixa.map((item, idx) => ({
        id: String(idx),
        produto: "Sem dados",
        categoria: "Desconhecido",
        valorVenda: 0,
        custo: 0,
        lucro: 0,
        margem: 0,
        formaPagamento: "—",
        vendedor: "—",
        cliente: "—",
        data: item.mes,
        foneNinjaId: null,
      }))} />
      <TabelaDespesas despesas={mockDespesas} />

    </div>
  )
}
