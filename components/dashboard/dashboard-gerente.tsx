"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  DollarSign,
  PiggyBank,
  Receipt,
  Target,
  TrendingUp,
  RefreshCw,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { KpiSkeleton } from "@/components/dashboard/kpi-skeleton"
import { PainelCompromissos } from "@/components/dashboard/painel-compromissos"
import { PainelTarefas } from "@/components/dashboard/painel-tarefas"
import { Leaderboard } from "@/components/gamificacao/leaderboard"
import { useIntegrationStatus } from "@/hooks/use-integration-status"
import { getDashboardSummary } from "@/lib/services/dashboard-summary"
import type { TarefaDB } from "@/types/tarefas"

interface IndicadoresGeral {
  faturamento: number
  despesas: number
  compras: number
  lucro: number
  ticketMedio: number
  estoqueTotal: number
  conversao: number
}

interface DashboardGerenteProps {
  tarefasHoje: TarefaDB[]
  tarefasPendentes: TarefaDB[]
  currentUser?: { id: string }
  mes: number
  ano: number
  availableYears: number[]
}

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

export function DashboardGerente({
  tarefasHoje,
  tarefasPendentes,
  currentUser,
  mes: initialMes,
  ano: initialAno,
  availableYears,
}: DashboardGerenteProps) {
  const [mes, setMes] = useState(initialMes)
  const [ano, setAno] = useState(initialAno)
  const [dia, setDia] = useState("")
  const [indicadores, setIndicadores] = useState<IndicadoresGeral>({
    faturamento: 0, despesas: 0, compras: 0, lucro: 0,
    ticketMedio: 0, estoqueTotal: 0, conversao: 0,
  })
  const [loadingKpi, setLoadingKpi] = useState(true)
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())

  const { status: integrationStatus, refetch: refetchIntegrationStatus } = useIntegrationStatus(5 * 60 * 1000)

  const fetchMensal = useCallback(async (m: number, a: number) => {
    setLoadingKpi(true)
    try {
      const monthlySummary = await getDashboardSummary({ year: a, month: m })
      if (monthlySummary) {
        setIndicadores({
          faturamento: toNum(monthlySummary.faturamentoMes ?? monthlySummary.financeiro?.receita),
          despesas:    toNum(monthlySummary.despesasMes ?? monthlySummary.financeiro?.despesasVariaveis),
          compras:     toNum(monthlySummary.comprasMes),
          lucro:       toNum(monthlySummary.lucroLiquidoMes ?? monthlySummary.financeiro?.netProfit),
          ticketMedio: toNum(monthlySummary.ticketMedio),
          estoqueTotal: 0,
          conversao:   0,
        })
        setTimeout(() => refetchIntegrationStatus(), 500)
      }
    } catch (error) {
      console.error("[DashboardGerente] Erro ao carregar dados:", error)
    } finally {
      setLoadingKpi(false)
    }
  }, [refetchIntegrationStatus])

  useEffect(() => {
    fetchMensal(mes, ano)
  }, [mes, ano, fetchMensal])

  const mesesDisponiveis = Array.from({ length: 12 }, (_, i) => ({
    nome: MESES[i],
    value: i,
  }))

  const yearsDisponiveis = availableYears

  const diasDisponiveis = Array.from({ length: 31 }, (_, i) => i + 1).filter(
    (d) => new Date(ano, mes, d).getMonth() === mes
  )

  const { faturamento, despesas, conversao, ticketMedio } = indicadores
  const saldoCaixa = faturamento - despesas
  const metaMensal = 100000
  const progresso = (faturamento / metaMensal) * 100

  const tarefasPorId = useMemo(
    () => new Map([...tarefasHoje, ...tarefasPendentes].map((t) => [t.id, t])),
    [tarefasHoje, tarefasPendentes]
  )

  const concluirTarefa = useCallback(
    async (id: string) => {
      try {
        setRiscados((prev) => new Set(prev).add(id))
        setTimeout(() => {
          setConcluidos((prev) => new Set(prev).add(id))
          setRiscados((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        }, 700)
        return true
      } catch {
        return false
      }
    },
    []
  )

  const pendentesVisiveis = useMemo(
    () => tarefasPendentes.filter((t) => !concluidos.has(t.id)),
    [tarefasPendentes, concluidos]
  )

  const hojeVisiveis = useMemo(
    () => tarefasHoje.filter((t) => !concluidos.has(t.id)),
    [tarefasHoje, concluidos]
  )

  const load = (v: string) => (loadingKpi ? "…" : v)

  return (
    <div className="space-y-6">
      {/* Cabeçalho + filtro */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Visão gerencial da operação</p>
          {integrationStatus?.lastSync && (
            <Badge className="mt-2 bg-green-100 text-green-800">
              <RefreshCw className="h-3 w-3 mr-1" />
              Sincronizado às{" "}
              {new Date(integrationStatus.lastSync).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Select
            value={String(mes)}
            onValueChange={(v) => {
              setMes(Number(v))
              setDia("")
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mesesDisponiveis.map((item) => (
                <SelectItem key={item.value} value={String(item.value)}>
                  {item.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(ano)}
            onValueChange={(v) => {
              setAno(Number(v))
              setDia("")
            }}
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearsDisponiveis.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs — linha 1: receita e saldo */}
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
            <KpiCard
              titulo="Faturamento do Mês"
              valor={load(formatBRL(faturamento))}
              descricao={`${MESES[mes]} ${ano}`}
              icone={Target}
              tendencia="up"
            />
            <KpiCard
              titulo="Saldo em Caixa"
              valor={load(formatBRL(saldoCaixa))}
              descricao="Fat. − despesas"
              icone={PiggyBank}
              tendencia={saldoCaixa > 0 ? "up" : "down"}
              destaque
            />
            <KpiCard
              titulo="Total Despesas"
              valor={load(formatBRL(despesas))}
              descricao="Contas a pagar (real)"
              icone={Receipt}
              tendencia="down"
            />
            <KpiCard
              titulo="Ticket Médio"
              valor={load(formatBRL(ticketMedio))}
              descricao="Por venda (real)"
              icone={DollarSign}
              tendencia="up"
            />
          </>
        )}
      </div>

      {/* KPIs — linha 2: taxa e meta */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
        {loadingKpi ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton destaque />
          </>
        ) : (
          <>
            <KpiCard
              titulo="Taxa de Conversão"
              valor={load((conversao * 100).toFixed(1) + "%")}
              descricao="Convertidas / pendentes"
              icone={Target}
              tendencia="up"
            />
            <KpiCard
              titulo="Progresso da Meta"
              valor={load(progresso.toFixed(0) + "%")}
              descricao={`Meta: R$ 100k`}
              icone={TrendingUp}
              tendencia={progresso >= 100 ? "up" : "neutral"}
              destaque
            />
          </>
        )}
      </div>

      {/* Painéis */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Leaderboard currentUserId={currentUser?.id} compact />
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
        <PainelCompromissos tarefas={hojeVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
      </div>
    </div>
  )
}
