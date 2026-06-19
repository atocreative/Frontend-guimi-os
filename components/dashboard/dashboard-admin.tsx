"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  DollarSign,
  Package,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GraficoVazio } from "@/components/dashboard/grafico-vazio"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { OrigemLeadsCard } from "@/components/dashboard/origem-leads-card"
import { KpiSkeleton } from "@/components/dashboard/kpi-skeleton"
import { VendedoresRanking } from "@/components/dashboard/vendedores-ranking"
import { PainelTarefas } from "@/components/dashboard/painel-tarefas"
import { DashboardAlertHub } from "@/components/dashboard/dashboard-alert-hub"
import { useGamificacaoFeedback } from "@/hooks/use-gamificacao-feedback"
import { useDashboardRanking } from "@/hooks/use-dashboard-ranking"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { api, ApiError } from "@/lib/api-client"
import { toast } from "sonner"

import { GlobalDateFilter } from "@/components/global/global-date-filter"
import { useFinancialConsolidated } from "@/lib/queries/use-financial-consolidated"
import { useFinancialMonthly } from "@/lib/queries/use-financial-monthly"
import { useFinancialDaily } from "@/lib/queries/use-financial-daily"

import type { TarefaDB } from "@/types/tarefas"
import { getDailyCardMeta } from "@/lib/financeiro-utils"

interface DashboardAdminUser {
  id: string
}

// ─── constantes ───────────────────────────────────────────────────────────────

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

// ─── utilitários ──────────────────────────────────────────────────────────────

const formatBRL = (valor: number) => {
  const n = Number.isFinite(valor) ? valor : 0
  const abs = Math.abs(n)
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)
  return n < 0 ? `-${formatted}` : formatted
}

function toNum(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function isNull(value: unknown): boolean {
  return value === null || value === undefined
}

// ─── componentes lazy ─────────────────────────────────────────────────────────

const GraficoFinanceiro = dynamic(
  () => import("@/components/dashboard/grafico-financeiro").then((m) => m.GraficoFinanceiro),
  {
    ssr: false,
    loading: () => (
      <Card><CardContent className="p-6"><Skeleton className="h-[240px] rounded-lg" /></CardContent></Card>
    ),
  }
)

// ─── props ────────────────────────────────────────────────────────────────────

interface DashboardAdminProps {
  tarefasHoje: TarefaDB[]
  tarefasPendentes: TarefaDB[]
  currentUser?: DashboardAdminUser
  mes?: number
  ano?: number
  availableYears: number[]
}

// ─── componente principal ─────────────────────────────────────────────────────

export function DashboardAdmin({
  tarefasHoje,
  tarefasPendentes,
  currentUser,
  mes: mesProp,
  ano: anoProp,
  availableYears,
}: DashboardAdminProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()
  const defaultYear = availableYears.filter((year) => year <= currentYear)
  const initialYear = anoProp && anoProp <= currentYear
    ? anoProp
    : defaultYear[defaultYear.length - 1] ?? currentYear

  const [mes, setMes] = useState(mesProp ?? currentMonth)
  const [ano, setAno] = useState(initialYear)
  const [dia, setDia] = useState<number | "">(() => {
    const sameMonth = (mesProp ?? currentMonth) === currentMonth && initialYear === currentYear
    return sameMonth ? currentDay : ""
  })
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())

  const { notifyTaskCompleted, notifyTaskCompletionError } = useGamificacaoFeedback()
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

  // ── queries — cache keys isolados, nunca compartilhados ────────────────────
  // monthlyQuery: dados do mês visualizado
  const monthlyQuery = useFinancialMonthly(ano, mes + 1)
  // todayQuery: sempre mês corrente — garante "Lucro de Hoje" ao navegar para meses anteriores
  // Quando mes/ano === hoje, React Query deduplicata via mesma query key, sem request duplo
  const todayQuery   = useFinancialMonthly(currentYear, currentMonth + 1)
  // dailyQuery: dia selecionado — desabilitado quando nenhum dia está ativo
  const dailyQuery   = useFinancialDaily(ano, mes + 1, diaValido !== "" ? (diaValido as number) : null)

  // ── KPIs mensais — derivados do monthlyQuery ────────────────────────────────
  const md = monthlyQuery.data
  const loadingKpi = monthlyQuery.isLoading && !md
  const erroFetch  = monthlyQuery.isError

  const faturamento  = toNum(md?.faturamentoMes)
  const lucro        = toNum(md?.lucroBrutoMes ?? md?.lucroOperacionalMes)
  const margemBruta  = toNum(md?.margemBruta)

  const lucroNulo       = !md || isNull(md.lucroOperacionalMes)
  const updatedAt       = md?.updatedAt ?? null

  // ── KPIs diários ────────────────────────────────────────────────────────────
  const faturamentoHoje         = todayQuery.data?.faturamentoDia ?? null
  const lucroLiquidoHoje        = todayQuery.data?.lucroLiquidoDia ?? null
  const faturamentoDiaSelecionado = dailyQuery.data?.faturamentoDia ?? null
  const lucroLiquidoDiaSelecionado = dailyQuery.data?.lucroLiquidoDia ?? null

  const faturamentoDia = diaValido !== ""
    ? Number(faturamentoDiaSelecionado ?? 0)
    : Number(faturamentoHoje ?? 0)
  const faturamentoDiaNulo = diaValido !== ""
    ? isNull(faturamentoDiaSelecionado)
    : isNull(faturamentoHoje)
  const lucroLiquidoDia = diaValido !== ""
    ? lucroLiquidoDiaSelecionado
    : lucroLiquidoHoje

  const dailyCardMeta = getDailyCardMeta({
    dia: diaValido !== "" ? (diaValido as number) : null,
    mes: diaValido !== "" ? mes : currentMonth,
    ano: diaValido !== "" ? ano : currentYear,
    mesAtual: currentMonth,
    anoAtual: currentYear,
    diaAtual: currentDay,
    lucroLiquidoDia,
  })

  // ── Canonical KPIs — all from md (useFinancialMonthly → /api/dashboard/summary) ──
  const consolidadoQuery = useFinancialConsolidated(ano, mes + 1)
  const consolidado = consolidadoQuery.data  // kept for alerts that use breakdown

  const lucroLiquidoReal    = toNum(md?.lucroLiquidoReal ?? consolidado?.realCompanyProfit)
  const lucroLiquidoFN      = toNum(md?.lucroLiquidoMes  ?? consolidado?.netProfit)
  const margemReal          = faturamento > 0 ? (lucroLiquidoReal / faturamento) * 100 : 0
  const adminExpenses       = toNum(consolidado?.administrativeExpenses)
  const maCount             = consolidado?.breakdown?.meuAssessor?.count ?? 0
  const maAvailable         = !consolidadoQuery.isLoading && !consolidadoQuery.isError && maCount > 0

  const margemBrutaEffective = faturamento > 0 ? (lucro / faturamento) * 100 : margemBruta

  const lucroInconsistente = !loadingKpi && !lucroNulo && lucro > 0 && lucro === faturamento

  // ── alertas agregados ─────────────────────────────────────────────────────────


  const dadosGrafico = useMemo(() =>
    (md?.grafico ?? []).map((item) => ({
      dia:         item.data,
      faturamento: Number(item.entradas ?? 0),
      despesas:    Number(item.saidas   ?? 0),
      lucro:       Number(item.saldo    ?? 0),
    })),
    [md]
  )

  // ── tarefas ─────────────────────────────────────────────────────────────────
  const tarefasPorId = useMemo(
    () => new Map([...tarefasHoje, ...tarefasPendentes].map((t) => [t.id, t])),
    [tarefasHoje, tarefasPendentes]
  )

  const concluirTarefa = useCallback(async (id: string) => {
    const tarefa = tarefasPorId.get(id)
    try {
      await api.completeTask(id)
      notifyTaskCompleted({ taskTitle: tarefa?.title })
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
      notifyTaskCompletionError()
      return false
    }
  }, [notifyTaskCompleted, notifyTaskCompletionError, tarefasPorId])

  const pendentesVisiveis = useMemo(
    () => tarefasPendentes.filter((t) => !concluidos.has(t.id)),
    [tarefasPendentes, concluidos]
  )

  // ── date filter handlers ─────────────────────────────────────────────────────
  const handleMonthChange = useCallback((m: number, y: number) => {
    setMes(m)
    setAno(y)
  }, [])

  const handleToday = useCallback(() => {
    setMes(currentMonth)
    setAno(currentYear)
    setDia(currentDay)
  }, [currentMonth, currentYear, currentDay])

  const handleDateSelect = useCallback((date: Date | null) => {
    if (!date) { setDia(""); return }
    setMes(date.getMonth())
    setAno(date.getFullYear())
    setDia(date.getDate())
  }, [])

  const selectedDate = diaValido !== "" ? new Date(ano, mes, diaValido as number) : null

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          {loadingKpi && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {monthlyQuery.isFetching && !loadingKpi && (
            <span className="text-xs text-muted-foreground/60 animate-pulse">Atualizando dados…</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Visão geral da operação Guimicell</p>
        {updatedAt && (
          <p className="text-xs text-muted-foreground">
            Atualizado às{" "}
            {new Date(updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

      </div>

      {/* ── Filtro de período ──────────────────────────────────────────────── */}
      <GlobalDateFilter
        month={mes}
        year={ano}
        selectedDate={selectedDate}
        maxDate={new Date(currentYear, currentMonth, currentDay)}
        onMonthChange={handleMonthChange}
        onToday={handleToday}
        onDateSelect={handleDateSelect}
      />

      {/* ── Linha 1: 4 KPIs (mesmo dado/visual do Financeiro) ─────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {loadingKpi ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton destaque />
            <KpiSkeleton />
          </>
        ) : (
          <>
            {/* 1. Lucro Líquido do Dia */}
            <KpiCard
              titulo="Lucro Líquido do Dia"
              valor={lucroLiquidoDia !== null ? formatBRL(lucroLiquidoDia) : "—"}
              descricao={lucroLiquidoDia !== null ? dailyCardMeta.descricao : "Dado do dia indisponível"}
              icone={DollarSign}
              tendencia={lucroLiquidoDia !== null && lucroLiquidoDia >= 0 ? "up" : "down"}
              accent={lucroLiquidoDia !== null ? (lucroLiquidoDia >= 0 ? "positive" : "negative") : undefined}
              tooltip={"O que é: Lucro gerado no dia — receitas do dia menos despesas proporcionais.\n\nOrigem: FinancialSnapshot diário via Fone Ninja.\n\nAtualização: Sincronização automática diária."}
            />
            {/* 2. Lucro Bruto do Mês */}
            <KpiCard
              titulo="Lucro Bruto do Mês"
              valor={formatBRL(lucro)}
              descricao={`${MESES[mes]} ${ano}`}
              icone={Target}
              tendencia="up"
              accent="info"
              tooltip={"O que é: Receita total menos o custo das mercadorias vendidas (CMV). Não considera despesas operacionais.\n\nOrigem: FinancialSnapshot mensal via Fone Ninja.\n\nAtualização: Sincronização automática diária."}
            />
            {/* 3. Lucro Líquido Real */}
            <KpiCard
              titulo="Lucro Líquido Real"
              valor={loadingKpi ? "…" : formatBRL(lucroLiquidoReal > 0 ? lucroLiquidoReal : lucroLiquidoFN)}
              descricao={faturamento > 0 ? `Margem ${margemReal.toFixed(1)}%` : `${MESES[mes]} ${ano}`}
              icone={TrendingUp}
              tendencia={lucroLiquidoReal >= 0 ? "up" : "down"}
              accent={lucroLiquidoReal >= 0 ? "positive" : "negative"}
              destaque
              tooltip={"O que é: Resultado final após dedução de todas as despesas. É o dinheiro que sobra de fato.\n\nOrigem: Fone Ninja + MeuAssessor via backend.\n\nAtualização: Sincronização automática diária."}
            />
            {/* 4. Produtos Vendidos no Mês */}
            {(() => {
              const total = md?.produtosVendidosMes ?? null
              const bd = md?.produtosVendidosBreakdown
              const sub = bd
                ? (() => {
                    if (bd.concluidos != null || bd.pendentes != null) {
                      return [
                        bd.concluidos != null ? `Concluídos: ${bd.concluidos}` : null,
                        bd.pendentes  != null ? `Pendentes: ${bd.pendentes}`   : null,
                        bd.outros != null && bd.outros > 0 ? `Outros: ${bd.outros}` : null,
                      ].filter(Boolean).join(" • ") || null
                    }
                    return [
                      bd.acessorios ? `Acessórios: ${bd.acessorios}` : null,
                      bd.aparelhos  ? `Aparelhos: ${bd.aparelhos}`   : null,
                      bd.outros     ? `Outros: ${bd.outros}`         : null,
                    ].filter(Boolean).join(" • ") || null
                  })()
                : null
              return (
                <KpiCard
                  titulo="Produtos Vendidos Mês"
                  valor={loadingKpi ? "…" : total != null ? String(total) : "—"}
                  descricao={sub ?? `${MESES[mes]} ${ano}`}
                  icone={Package}
                  accent="info"
                  tooltip={"O que é: Quantidade total de produtos vendidos no mês. Fonte: Fone Ninja (soma de unidades, não registros).\n\nOrigem: backend /api/dashboard/summary.\n\nAtualização: Sincronização automática."}
                />
              )
            })()}
          </>
        )}
      </div>


      {/* ── Linha 3: Central Executiva ───────────────────────────────────── */}
      <DashboardAlertHub 
        month={mes + 1} 
        year={ano} 
        date={diaValido !== "" ? String(diaValido) : undefined} 
      />

      {/* ── Linha 5: Gráficos + Origem de Leads ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          {dadosGrafico.length > 0 ? (
            <GraficoFinanceiro dados={dadosGrafico} titulo={`Lucro Médio Diário — ${MESES[mes]} ${ano}`} />
          ) : !loadingKpi ? (
            <GraficoVazio mensagem={`Sem dados para ${MESES[mes]} ${ano}`} />
          ) : (
            <Card><CardContent className="p-6"><Skeleton className="h-[240px] rounded-lg" /></CardContent></Card>
          )}
        </div>
        <OrigemLeadsCard />
      </div>

      {/* ── Linha 6: Ranking + Tarefas lado a lado ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VendedoresRanking entries={rankingEntries} loading={rankingLoading} />
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
      </div>

    </div>
  )
}
