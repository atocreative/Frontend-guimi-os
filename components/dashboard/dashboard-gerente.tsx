"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  DollarSign,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { GraficoVazio } from "@/components/dashboard/grafico-vazio"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { KpiSkeleton } from "@/components/dashboard/kpi-skeleton"
import { VendedoresRanking } from "@/components/dashboard/vendedores-ranking"
import { OrigemLeadsCard } from "@/components/dashboard/origem-leads-card"
import { PainelTarefas } from "@/components/dashboard/painel-tarefas"
import { PainelAlertasGlobal } from "@/components/dashboard/painel-alertas-global"
import { useFinancialConsolidated } from "@/lib/queries/use-financial-consolidated"
import { useDashboardRanking } from "@/hooks/use-dashboard-ranking"
import { getDashboardAlerts } from "@/lib/services/dashboard-alerts"
import { GlobalDateFilter } from "@/components/global/global-date-filter"
import { useFinancialMonthly } from "@/lib/queries/use-financial-monthly"
import { useFinancialDaily } from "@/lib/queries/use-financial-daily"
import { api, ApiError } from "@/lib/api-client"
import { toast } from "sonner"
import type { TarefaDB } from "@/types/tarefas"

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
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())

  const { entries: rankingEntries, loading: rankingLoading } = useDashboardRanking({ mes, ano })
  const consolidadoQuery = useFinancialConsolidated(ano, mes + 1)
  const consolidado = consolidadoQuery.data
  const maCount = consolidado?.breakdown?.meuAssessor?.count ?? 0
  const maAvailable = !consolidadoQuery.isLoading && !consolidadoQuery.isError && maCount > 0
  const lucroLiquidoRealMes = toNum(consolidado?.realCompanyProfit)
  const lucroLiquidoFN = toNum(consolidado?.netProfit)
  const margemRealMes = toNum(consolidado?.realMargin)
  const lucroBrutoMes = toNum(consolidado?.grossProfit)

  const diasDisponiveis = useMemo(() => {
    const total = new Date(ano, mes + 1, 0).getDate()
    const maxDay = ano === currentYear && mes === currentMonth ? currentDay : total
    return Array.from({ length: maxDay }, (_, i) => i + 1)
  }, [ano, mes, currentYear, currentMonth, currentDay])

  const diaValido = dia !== "" && dia <= diasDisponiveis.length ? dia : ""

  useEffect(() => {
    if (dia !== "" && dia > diasDisponiveis.length) setDia("")
  }, [dia, diasDisponiveis.length])

  // ── queries — cache keys isolados ──────────────────────────────────────────
  const monthlyQuery = useFinancialMonthly(ano, mes + 1)
  const todayQuery   = useFinancialMonthly(currentYear, currentMonth + 1)
  const dailyQuery   = useFinancialDaily(ano, mes + 1, diaValido !== "" ? (diaValido as number) : null)

  // ── KPIs mensais ────────────────────────────────────────────────────────────
  const md = monthlyQuery.data
  const loadingKpi = monthlyQuery.isLoading && !md

  const faturamento = toNum(md?.faturamentoMes ?? md?.financeiro?.receita)
  const updatedAt   = md?.updatedAt ?? null

  // ── KPIs diários ────────────────────────────────────────────────────────────
  const faturamentoHoje           = todayQuery.data?.faturamentoDia ?? null
  const faturamentoDiaSelecionado = dailyQuery.data?.faturamentoDia ?? null
  const faturamentoDiaHojeNulo    = faturamentoHoje === null || faturamentoHoje === 0

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
        faturamentoDia,
        loadingKpi,
        tarefasPendentes,
        isHoje: diaValido === "" && mes === currentMonth && ano === currentYear,
      }),
    [faturamentoDia, loadingKpi, tarefasPendentes, diaValido, mes, ano, currentMonth, currentYear]
  )

  const dadosGrafico = useMemo(() =>
    (md?.grafico ?? []).map((item) => ({
      dia:         item.data,
      faturamento: Number(item.entradas ?? 0),
      despesas:    Number(item.saidas   ?? 0),
      lucro:       Number(item.saldo    ?? 0),
    })),
    [md]
  )

  const tarefasPorId = useMemo(
    () => new Map([...tarefasHoje, ...tarefasPendentes].map((t) => [t.id, t])),
    [tarefasHoje, tarefasPendentes]
  )

  const concluirTarefa = useCallback(async (id: string) => {
    const tarefa = tarefasPorId.get(id)
    try {
      await api.completeTask(id)
      setRiscados((prev) => new Set(prev).add(id))
      setTimeout(() => {
        setConcluidos((prev) => new Set(prev).add(id))
        setRiscados((prev) => { const n = new Set(prev); n.delete(id); return n })
      }, 700)
      return true
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        toast.error("Tarefa atrasada requer justificativa. Acesse a Agenda para concluí-la.")
        return false
      }
      toast.error(`Não foi possível concluir "${tarefa?.title ?? "tarefa"}".`)
      return false
    }
  }, [tarefasPorId])

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
        {updatedAt && (
          <p className="text-xs text-muted-foreground">
            Atualizado às{" "}
            {new Date(updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {loadingKpi ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton destaque />
          </>
        ) : (
          <>
            <KpiCard
              titulo={diaValido !== "" ? `Lucro Líquido — Dia ${diaValido}` : "Lucro do Dia (Líquido)"}
              valor={faturamentoDiaNulo ? formatBRL(0) : formatBRL(faturamentoDia)}
              descricao={
                diaValido !== ""
                  ? `${diaValido}/${mes + 1}/${ano}`
                  : `Hoje, ${currentDay}/${currentMonth + 1}`
              }
              icone={DollarSign}
              tendencia={faturamentoDia >= 0 ? "up" : "down"}
              accent={faturamentoDia >= 0 ? "positive" : "negative"}
            />
            <KpiCard
              titulo="Lucro Bruto do Mês"
              valor={formatBRL(lucroBrutoMes > 0 ? lucroBrutoMes : faturamento)}
              descricao={`${MESES[mes]} ${ano}`}
              icone={TrendingUp}
              tendencia="up"
              accent="info"
            />
            <KpiCard
              titulo="Lucro Líquido Real"
              valor={consolidadoQuery.isLoading && !consolidado ? "…" : formatBRL(maAvailable ? lucroLiquidoRealMes : lucroLiquidoFN)}
              descricao={maAvailable ? `Margem ${margemRealMes.toFixed(1)}%` : `${MESES[mes]} ${ano}`}
              icone={Wallet}
              tendencia={lucroLiquidoRealMes >= 0 ? "up" : "down"}
              accent={lucroLiquidoRealMes >= 0 ? "positive" : "negative"}
              destaque
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
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} compact totalPendentes={tarefasPendentes.length} />
      </div>
    </div>
  )
}
