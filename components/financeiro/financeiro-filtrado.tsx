"use client"

import { useState, useEffect, useCallback } from "react"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  PiggyBank,
  Target,
} from "lucide-react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { TabelaDespesas } from "@/components/financeiro/tabela-despesas"
import { TabelaEntradas } from "@/components/financeiro/tabela-entradas"
import { GraficoFluxoCaixa } from "@/components/financeiro/grafico-fluxo-caixa"
import { GraficoCategorias } from "@/components/financeiro/grafico-categorias"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DashboardSummary } from "@/lib/types/dashboard"
import type { DespesaItem } from "@/components/financeiro/tabela-despesas"
import type { SaleRow } from "@/components/financeiro/tabela-entradas"

const META_MES = 100_000

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function toNum(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function brl(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(toNum(valor))
}

function gerarPeriodo(mes: number, ano: number) {
  const start = new Date(Date.UTC(ano, mes, 1))
  const end = new Date(Date.UTC(ano, mes + 1, 1) - 1)
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

function mesAnterior(mes: number, ano: number): { mes: number; ano: number } {
  return mes === 0 ? { mes: 11, ano: ano - 1 } : { mes: mes - 1, ano }
}

async function fetchSummaryPeriodo(mes: number, ano: number): Promise<DashboardSummary | null> {
  try {
    const { startDate, endDate } = gerarPeriodo(mes, ano)
    const res = await fetch(
      `/api/dashboard/summary?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    )
    if (!res.ok) return null
    const data = await res.json().catch(() => null)
    return data ?? null
  } catch {
    return null
  }
}

interface Props {
  initialSummary: DashboardSummary | null
  initialMes: number
  initialAno: number
  initialSummaryAnterior?: DashboardSummary | null
  availableYears: number[]
}

export function FinanceiroFiltrado({
  initialSummary,
  initialMes,
  initialAno,
  initialSummaryAnterior = null,
  availableYears,
}: Props) {
  const [mes, setMes] = useState(initialMes)
  const [ano, setAno] = useState(initialAno)
  const [summary, setSummary] = useState<DashboardSummary | null>(initialSummary)
  const [summaryAnterior, setSummaryAnterior] = useState<DashboardSummary | null>(initialSummaryAnterior)
  const [despesas, setDespesas] = useState<DespesaItem[]>([])
  const [entradas, setEntradas] = useState<SaleRow[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(false)

  const isInicial = mes === initialMes && ano === initialAno

  const fetchAmbos = useCallback(async (m: number, a: number) => {
    setLoading(true)
    setErro(false)
    const ant = mesAnterior(m, a)
    const { startDate, endDate } = gerarPeriodo(m, a)
    const params = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    type ApiListResponse = { raw?: DespesaItem[]; total?: number }

    const [atual, anterior, despesasRes, entradasRes] = await Promise.all([
      fetchSummaryPeriodo(m, a),
      fetchSummaryPeriodo(ant.mes, ant.ano),
      fetch(`/api/financeiro/despesas?${params}`)
        .then((r) => r.ok ? r.json() as Promise<ApiListResponse> : ({} as ApiListResponse))
        .catch(() => ({} as ApiListResponse)),
      fetch(`/api/financeiro/compras?${params}`)
        .then((r) => r.ok ? r.json() as Promise<ApiListResponse> : ({} as ApiListResponse))
        .catch(() => ({} as ApiListResponse)),
    ])

    if (!atual) setErro(true)
    setSummary(atual)
    setSummaryAnterior(anterior)
    setDespesas(Array.isArray(despesasRes?.raw) ? despesasRes.raw : [])
    setEntradas(Array.isArray(entradasRes?.raw) ? entradasRes.raw : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!isInicial) {
      fetchAmbos(mes, ano)
    }
  }, [mes, ano, isInicial, fetchAmbos])

  // KPIs
  const faturamento = toNum(summary?.faturamentoMes ?? summary?.financeiro?.receita)
  const lucro = toNum(summary?.lucroLiquidoMes ?? summary?.financeiro?.netProfit)
  const totalDespesas = toNum(summary?.despesasMes ?? summary?.financeiro?.despesasVariaveis)
  const totalCompras = toNum(summary?.comprasMes)
  const totalVendas = toNum(summary?.totalVendas)
  const ticketMedio = toNum(summary?.ticketMedio)
  const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0
  const saldoCaixa = Math.max(0, faturamento - totalDespesas - totalCompras)

  // Meta e progresso
  const percentualMeta = META_MES > 0 ? Math.min((faturamento / META_MES) * 100, 999) : 0
  const barraWidth = Math.min(percentualMeta, 100)

  // Crescimento vs mês anterior
  const faturamentoAnterior = toNum(summaryAnterior?.faturamentoMes ?? summaryAnterior?.financeiro?.receita)
  const crescimento = faturamentoAnterior > 0
    ? ((faturamento - faturamentoAnterior) / faturamentoAnterior) * 100
    : null

  // Dados para gráficos — DashboardSummary.grafico já está no formato { data, entradas, saidas, saldo }
  const fluxoCaixa = Array.isArray(summary?.grafico) ? summary.grafico : []

  const categorias = totalDespesas > 0
    ? [{ categoria: "Despesas", valor: totalDespesas, percentual: 100 }]
    : []

  const crescimentoLabel = crescimento === null
    ? "Sem dados do mês anterior"
    : crescimento >= 0
      ? `↑ ${crescimento.toFixed(1)}% vs ${MESES[mesAnterior(mes, ano).mes]}`
      : `↓ ${Math.abs(crescimento).toFixed(1)}% vs ${MESES[mesAnterior(mes, ano).mes]}`

  return (
    <div className="space-y-6">
      {/* Cabeçalho + filtros */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Financeiro</h2>
          <p className="text-sm text-muted-foreground">
            KPIs mensais, registros recentes e fluxo de caixa.
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((nome, i) => (
                <SelectItem key={i} value={String(i)}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status de dados */}
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-green-100 text-green-800 gap-1">
          <RefreshCw className="h-3 w-3" />
          Sincronizado com PostgreSQL
        </Badge>
        <Badge variant="outline">Origem: Backend Real</Badge>
      </div>

      {/* Barra de progresso da meta */}
      {faturamento > 0 && (
        <div className="rounded-lg border bg-card px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <Target className="h-4 w-4 text-muted-foreground" />
              Meta mensal — {brl(META_MES)}
            </span>
            <span className={percentualMeta >= 100 ? "text-emerald-600 font-semibold" : "text-muted-foreground"}>
              {percentualMeta.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                percentualMeta >= 100 ? "bg-emerald-500" : percentualMeta >= 70 ? "bg-blue-500" : "bg-amber-500"
              }`}
              style={{ width: `${barraWidth}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {brl(faturamento)} arrecadados · faltam {brl(Math.max(0, META_MES - faturamento))}
          </p>
        </div>
      )}

      {/* Alertas */}
      {loading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Carregando dados de {MESES[mes]} {ano}…
        </div>
      )}
      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Não foi possível carregar dados para o período selecionado.
        </div>
      )}
      {!loading && !erro && !summary && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Nenhum dado disponível para {MESES[mes]} {ano}.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          titulo="Faturamento do Mês"
          valor={brl(faturamento)}
          descricao={crescimentoLabel}
          icone={DollarSign}
          tendencia={crescimento === null ? "up" : crescimento >= 0 ? "up" : "down"}
          destaque
        />
        <KpiCard
          titulo="Lucro Líquido"
          valor={brl(lucro)}
          descricao={`Margem líquida ${toNum(margem).toFixed(1)}%`}
          icone={TrendingUp}
          tendencia={lucro > 0 ? "up" : "down"}
        />
        <KpiCard
          titulo="Total Despesas"
          valor={brl(totalDespesas)}
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
          titulo="Total Vendas"
          valor={String(totalVendas)}
          descricao={`${MESES[mes]} ${ano}`}
          icone={TrendingDown}
          tendencia={totalVendas > 0 ? "up" : "down"}
        />
        <KpiCard
          titulo="Ticket Médio"
          valor={brl(ticketMedio)}
          descricao="Por venda"
          icone={PiggyBank}
          tendencia={ticketMedio > 0 ? "up" : "down"}
        />
        <KpiCard
          titulo="Lucro Bruto"
          valor={brl(faturamento - totalDespesas)}
          descricao="Receita − despesas"
          icone={TrendingUp}
          tendencia={faturamento > totalDespesas ? "up" : "down"}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GraficoFluxoCaixa dados={fluxoCaixa} mes={mes} ano={ano} />
        <GraficoCategorias dados={categorias} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TabelaDespesas despesas={despesas} />
        <TabelaEntradas entradas={entradas} />
      </div>
    </div>
  )
}
