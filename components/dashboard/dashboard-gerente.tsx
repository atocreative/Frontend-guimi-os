"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  DollarSign,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { GraficoVazio } from "@/components/dashboard/grafico-vazio"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { KpiSkeleton } from "@/components/dashboard/kpi-skeleton"
import { VendedoresRanking } from "@/components/dashboard/vendedores-ranking"
import { OrigemLeadsCard } from "@/components/dashboard/origem-leads-card"
import { PainelTarefas } from "@/components/dashboard/painel-tarefas"
import { PainelAlertasGlobal } from "@/components/dashboard/painel-alertas-global"
import { useIntegrationStatus } from "@/hooks/use-integration-status"
import { useDashboardRanking } from "@/hooks/use-dashboard-ranking"
import { getDashboardSummary } from "@/lib/services/dashboard-summary"
import { getDashboardAlerts } from "@/lib/services/dashboard-alerts"
import { GlobalDateFilter } from "@/components/global/global-date-filter"
import type { TarefaDB } from "@/types/tarefas"
import type { OverviewExtra } from "@/lib/services/api"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const formatBRL = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)

function toNum(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function isNull(value: unknown): boolean {
  return value === null || value === undefined
}

const GraficoFinanceiro = dynamic(
  () => import("@/components/dashboard/grafico-financeiro").then((m) => m.GraficoFinanceiro),
  {
    ssr: false,
    loading: () => (
      <Card><CardContent className="p-6"><Skeleton className="h-[240px] rounded-lg" /></CardContent></Card>
    ),
  }
)


interface DashboardGerenteProps {
  tarefasHoje: TarefaDB[]
  tarefasPendentes: TarefaDB[]
  currentUser?: { id: string }
  mes: number
  ano: number
  availableYears: number[]
}

export function DashboardGerente({
  tarefasHoje,
  tarefasPendentes,
  currentUser,
  mes: initialMes,
  ano: initialAno,
  availableYears,
}: DashboardGerenteProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()

  const [mes, setMes] = useState(initialMes)
  const [ano, setAno] = useState(initialAno)
  const [dia, setDia] = useState<number | "">("")

  const [faturamento, setFaturamento] = useState(0)
  const [faturamentoHoje, setFaturamentoHoje] = useState<number | null>(null)
  const [faturamentoDiaSelecionado, setFaturamentoDiaSelecionado] = useState<number | null>(null)
  const [totalVendas, setTotalVendas] = useState(0)
  const [totalVendasNulo, setTotalVendasNulo] = useState(false)
  const [faturamentoDiaHojeNulo, setFaturamentoDiaHojeNulo] = useState(false)
  const [overviewExtra, setOverviewExtra] = useState<OverviewExtra | null>(null)
  const [loadingKpi, setLoadingKpi] = useState(true)
  const [erroFetch, setErroFetch] = useState(false)

  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())

  const { status: integrationStatus, refetch: refetchIntegrationStatus } = useIntegrationStatus(5 * 60 * 1000)
  const { entries: rankingEntries, loading: rankingLoading } = useDashboardRanking({ mes, ano })

  const diasDisponiveis = useMemo(() => {
    const total = new Date(ano, mes + 1, 0).getDate()
    const maxDay = ano === currentYear && mes === currentMonth ? currentDay : total
    return Array.from({ length: maxDay }, (_, i) => i + 1)
  }, [ano, mes, currentYear, currentMonth, currentDay])

  const diaValido = dia !== "" && dia <= diasDisponiveis.length ? dia : ""

  useEffect(() => {
    if (dia !== "" && dia > diasDisponiveis.length) setDia("")
  }, [dia, diasDisponiveis.length])

  const fetchMensal = useCallback(async (m: number, a: number) => {
    setLoadingKpi(true)
    setErroFetch(false)
    try {
      const s = await getDashboardSummary({ year: a, month: m })
      if (s) {
        const fat = toNum(s.faturamentoMes ?? s.financeiro?.receita)
        const tv = s.totalVendas
        setFaturamento(fat)
        setTotalVendas(toNum(tv))
        setTotalVendasNulo(isNull(tv))
        setOverviewExtra({
          grafico: (s.grafico ?? []).map((item) => ({
            dia: item.data,
            receita: item.entradas,
            custo: item.saidas,
            lucro: item.saldo,
          })),
          resumo: { faturamentoDia: toNum(s.faturamentoDia) },
          // @ts-ignore
          vendedores: (s as any).rankingVendedores ?? (s as any).vendedores ?? undefined,
        })
        setTimeout(() => refetchIntegrationStatus(), 500)
      }
    } catch {
      setErroFetch(true)
    } finally {
      setLoadingKpi(false)
    }
  }, [refetchIntegrationStatus])

  const fetchHoje = useCallback(async () => {
    try {
      const s = await getDashboardSummary({ year: currentYear, month: currentMonth, day: currentDay })
      const val = s ? toNum(s.faturamentoDia) : null
      setFaturamentoHoje(val)
      setFaturamentoDiaHojeNulo(isNull(val))
    } catch {
      setFaturamentoHoje(null)
    }
  }, [currentYear, currentMonth, currentDay])

  const fetchDiario = useCallback(async (m: number, a: number, d: number | "") => {
    if (d === "") { setFaturamentoDiaSelecionado(null); return }
    try {
      const s = await getDashboardSummary({ year: a, month: m, day: d })
      setFaturamentoDiaSelecionado(s ? toNum(s.faturamentoDia) : null)
    } catch {
      setFaturamentoDiaSelecionado(null)
    }
  }, [])

  useEffect(() => { fetchMensal(mes, ano) }, [mes, ano, fetchMensal])
  useEffect(() => { fetchHoje() }, [fetchHoje])
  useEffect(() => { fetchDiario(mes, ano, diaValido === "" ? "" : diaValido) }, [mes, ano, diaValido, fetchDiario])

  const faturamentoDia = diaValido !== ""
    ? Number(faturamentoDiaSelecionado ?? 0)
    : Number(faturamentoHoje ?? 0)
  const faturamentoDiaNulo = diaValido !== ""
    ? isNull(faturamentoDiaSelecionado)
    : faturamentoDiaHojeNulo

  const alertas = useMemo(
    () =>
      getDashboardAlerts({
        role: "GERENTE",
        integrationStatus,
        faturamentoDia,
        loadingKpi,
        tarefasPendentes,
        isHoje: diaValido === "" && mes === currentMonth && ano === currentYear,
      }),
    [integrationStatus, faturamentoDia, loadingKpi, tarefasPendentes, diaValido, mes, ano, currentMonth, currentYear]
  )

  const dadosGrafico = useMemo(() =>
    (overviewExtra?.grafico ?? []).map((item) => ({
      mes: item.mes,
      dia: item.dia,
      faturamento: Number(item.receita ?? 0),
      despesas: Number(item.custo ?? 0),
      lucro: Number(item.lucro ?? 0),
    })),
    [overviewExtra]
  )

  const tarefasPorId = useMemo(
    () => new Map([...tarefasHoje, ...tarefasPendentes].map((t) => [t.id, t])),
    [tarefasHoje, tarefasPendentes]
  )

  const concluirTarefa = useCallback(async (id: string) => {
    try {
      setRiscados((prev) => new Set(prev).add(id))
      setTimeout(() => {
        setConcluidos((prev) => new Set(prev).add(id))
        setRiscados((prev) => { const n = new Set(prev); n.delete(id); return n })
      }, 700)
      return true
    } catch {
      return false
    }
  }, [])

  const pendentesVisiveis = useMemo(
    () => tarefasPendentes.filter((t) => !concluidos.has(t.id)),
    [tarefasPendentes, concluidos]
  )
  const handleMonthChange = useCallback((m: number, y: number) => { setMes(m); setAno(y) }, [])
  const handleToday = useCallback(() => { setMes(currentMonth); setAno(currentYear); setDia(currentDay) }, [currentMonth, currentYear, currentDay])
  const handleDateSelect = useCallback((date: Date | null) => {
    if (!date) { setDia(""); return }
    setMes(date.getMonth())
    setAno(date.getFullYear())
    setDia(date.getDate())
  }, [])

  const selectedDate = diaValido !== "" ? new Date(ano, mes, diaValido as number) : null

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          {loadingKpi && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-sm text-muted-foreground">Visão gerencial da operação</p>
        {integrationStatus?.lastSync && (
          <p className="text-xs text-muted-foreground">
            Sincronizado às {new Date(integrationStatus.lastSync).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
        {erroFetch && !loadingKpi && (
          <Badge variant="destructive" className="mt-1">
            Erro ao carregar dados — exibindo último resultado
          </Badge>
        )}
      </div>

      {/* Filtro de período */}
      <GlobalDateFilter
        month={mes}
        year={ano}
        selectedDate={selectedDate}
        maxDate={new Date(currentYear, currentMonth, currentDay)}
        onMonthChange={handleMonthChange}
        onToday={handleToday}
        onDateSelect={handleDateSelect}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {loadingKpi ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton destaque />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              titulo={diaValido !== "" ? `Faturamento — Dia ${diaValido}` : "Faturamento de Hoje"}
              valor={faturamentoDiaNulo ? "Indisponível" : formatBRL(faturamentoDia)}
              descricao={
                diaValido !== ""
                  ? `${diaValido}/${mes + 1}/${ano}`
                  : faturamentoDia > 0
                    ? `Hoje, ${currentDay}/${currentMonth + 1}`
                    : "Aguardando dados"
              }
              icone={DollarSign}
              tendencia={faturamentoDiaNulo ? "neutral" : "up"}
            />
            <KpiCard
              titulo="Faturamento do Mês"
              valor={formatBRL(faturamento)}
              descricao={`${MESES[mes]} ${ano}`}
              icone={Target}
              tendencia="up"
              destaque
            />
            <KpiCard
              titulo="Total Vendas no Mês"
              valor={totalVendasNulo ? "Indisponível" : totalVendas > 0 ? String(totalVendas) : "—"}
              descricao={totalVendasNulo ? "Sem dados do backend" : "Vendas consolidadas"}
              icone={ShoppingCart}
              tendencia={totalVendasNulo ? "neutral" : "up"}
            />
            <KpiCard
              titulo="Taxa de Conversão"
              valor="—"
              descricao="Aguardando Kommo CRM"
              icone={TrendingUp}
              tendencia="neutral"
            />
          </>
        )}
      </div>

      {/* Alertas agregados */}
      <PainelAlertasGlobal alerts={alertas} />

      {/* Gráfico evolução faturamento */}
      {dadosGrafico.length > 0 ? (
        <GraficoFinanceiro dados={dadosGrafico} titulo={`Lucro Médio Diário — ${MESES[mes]} ${ano}`} />
      ) : !loadingKpi ? (
        <GraficoVazio mensagem={`Sem dados de gráfico para ${MESES[mes]} ${ano}`} />
      ) : null}

      {/* Origem leads — dados reais */}
      <OrigemLeadsCard />

      {/* Ranking + Tarefas lado a lado */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VendedoresRanking entries={rankingEntries} loading={rankingLoading} />
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
      </div>
    </div>
  )
}
