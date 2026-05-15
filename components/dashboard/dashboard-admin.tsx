"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  AlertTriangle,
  Clock,
  DollarSign,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
  WifiOff,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GraficoVazio } from "@/components/dashboard/grafico-vazio"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { KpiSkeleton } from "@/components/dashboard/kpi-skeleton"
import { VendedoresRanking } from "@/components/dashboard/vendedores-ranking"
import { PainelCompromissos } from "@/components/dashboard/painel-compromissos"
import { PainelTarefas } from "@/components/dashboard/painel-tarefas"
import { Leaderboard } from "@/components/gamificacao/leaderboard"
import { useGamificacaoFeedback } from "@/hooks/use-gamificacao-feedback"
import { useIntegrationStatus } from "@/hooks/use-integration-status"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { backendService } from "@/lib/services/backend-service"
import { type IndicadoresGeral, type OverviewExtra } from "@/lib/services/api"
import { getDashboardSummary } from "@/lib/services/dashboard-summary"
import type { TarefaDB } from "@/types/tarefas"

interface DashboardAdminUser {
  id: string
}

// ─── constantes ───────────────────────────────────────────────────────────────

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]


// ─── utilitários ──────────────────────────────────────────────────────────────

const formatBRL = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)

function gerarPeriodo(mes: number, ano: number, dia?: number) {
  if (dia) {
    const start = new Date(Date.UTC(ano, mes, dia))
    const end = new Date(Date.UTC(ano, mes, dia + 1) - 1)
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }

  const start = new Date(Date.UTC(ano, mes, 1))
  const end = new Date(Date.UTC(ano, mes + 1, 1) - 1)
  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

const INDICADORES_ZERO: IndicadoresGeral = {
  faturamento: 0, despesas: 0, compras: 0, lucro: 0,
  ticketMedio: 0, estoqueTotal: 0, conversao: 0,
}

interface AlertaItem {
  id: string
  tipo: "destructive" | "warning" | "info"
  titulo: string
  mensagem: string
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
  const [dia, setDia] = useState<number | "">(mesProp === undefined && anoProp === undefined && initialYear === currentYear ? currentDay : "")
  const [indicadores, setIndicadores] = useState<IndicadoresGeral>(INDICADORES_ZERO)
  const [totalVendas, setTotalVendas] = useState(0)
  const [loadingKpi, setLoadingKpi] = useState(true)
  const [overviewExtra, setOverviewExtra] = useState<OverviewExtra | null>(null)
  const [faturamentoDiaSelecionado, setFaturamentoDiaSelecionado] = useState<number | null>(null)
  const [erroFetch, setErroFetch] = useState(false)
  const [nullFlags, setNullFlags] = useState({ lucro: false, totalVendas: false, faturamentoDia: false })

  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [riscados, setRiscados] = useState<Set<string>>(new Set())
  const { notifyTaskCompleted, notifyTaskCompletionError } = useGamificacaoFeedback()
  const { status: integrationStatus, refetch: refetchIntegrationStatus } = useIntegrationStatus()
  const yearsDisponiveis = useMemo(() => availableYears.filter((year) => year <= currentYear), [availableYears, currentYear])
  const mesesDisponiveis = useMemo(() => {
    if (ano < currentYear) return MESES.map((nome, i) => ({ nome, value: i }))
    return MESES.slice(0, currentMonth + 1).map((nome, i) => ({ nome, value: i }))
  }, [ano, currentMonth, currentYear])
  const diasDisponiveis = useMemo(() => {
    const total = new Date(ano, mes + 1, 0).getDate()
    // Limit to current day if viewing current month/year
    const maxDay = ano === currentYear && mes === currentMonth ? currentDay : total
    return Array.from({ length: maxDay }, (_, i) => i + 1)
  }, [ano, mes, currentYear, currentMonth, currentDay])
  const diaValido = dia !== "" && dia <= diasDisponiveis.length ? dia : ""

  useEffect(() => {
    if (dia !== "" && dia > diasDisponiveis.length) {
      setDia("")
    }
  }, [dia, diasDisponiveis.length])
  // ── fetch via /api/dashboard/summary ────────────────────────────────────────
  const fetchMensal = useCallback(async (m: number, a: number) => {
    setLoadingKpi(true)
    setErroFetch(false)
    try {
      const monthlySummary = await getDashboardSummary({ year: a, month: m })
      if (monthlySummary) {
        const lucroRaw = monthlySummary.lucroLiquidoMes ?? monthlySummary.financeiro?.netProfit
        const totalVendasRaw = monthlySummary.totalVendas
        const fatDiaRaw = monthlySummary.faturamentoDia
        setNullFlags({
          lucro: isNull(lucroRaw),
          totalVendas: isNull(totalVendasRaw),
          faturamentoDia: isNull(fatDiaRaw),
        })
        setIndicadores({
          faturamento: toNum(monthlySummary.faturamentoMes ?? monthlySummary.financeiro?.receita),
          despesas:    toNum(monthlySummary.despesasMes ?? monthlySummary.financeiro?.despesasVariaveis),
          compras:     toNum(monthlySummary.comprasMes),
          lucro:       toNum(lucroRaw),
          ticketMedio: toNum(monthlySummary.ticketMedio),
          estoqueTotal: 0,
          conversao:   0,
        })
        setTotalVendas(toNum(totalVendasRaw))
        setOverviewExtra({
          grafico: (monthlySummary.grafico ?? []).map((item) => ({
            dia:     item.data,
            receita: item.entradas,
            custo:   item.saidas,
            lucro:   item.saldo,
          })),
          resumo: { faturamentoDia: toNum(monthlySummary.faturamentoDia) },
          // @ts-ignore - vendedores may come from backend even if not in type yet
          vendedores: (monthlySummary as any).rankingVendedores ?? (monthlySummary as any).vendedores ?? undefined,
        })
      }
      // se null, mantém dados anteriores — não zera tudo
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
      setErroFetch(true)
      // mantém dados anteriores visíveis
    } finally {
      setLoadingKpi(false)
    }
  }, [])

  const fetchDiario = useCallback(async (m: number, a: number, d: number | "") => {
    if (d === "") {
      setFaturamentoDiaSelecionado(null)
      return
    }

    try {
      const dailySummary = await getDashboardSummary({ year: a, month: m, day: d })
      setFaturamentoDiaSelecionado(dailySummary ? toNum(dailySummary.faturamentoDia) : null)
    } catch (error) {
      console.error("Erro ao carregar resumo diário:", error)
      setFaturamentoDiaSelecionado(null)
    }
  }, [])

  useEffect(() => { fetchMensal(mes, ano) }, [mes, ano, fetchMensal])
  useEffect(() => { fetchDiario(mes, ano, diaValido === "" ? "" : diaValido) }, [mes, ano, diaValido, fetchDiario])

  // ── auto-refresh integration status após cada atualização de dados ──────────
  useEffect(() => {
    const timer = setTimeout(() => refetchIntegrationStatus(), 500)
    return () => clearTimeout(timer)
  }, [indicadores, refetchIntegrationStatus])

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const { faturamento, lucro } = indicadores
  const faturamentoDia = diaValido !== "" ? Number(faturamentoDiaSelecionado ?? 0) : Number(overviewExtra?.resumo?.faturamentoDia ?? 0)

  // Null-awareness: valores que o backend não retornou (null) ≠ zero real
  const lucroNulo = nullFlags.lucro
  const totalVendasNulo = nullFlags.totalVendas
  const faturamentoDiaNulo = nullFlags.faturamentoDia && diaValido === ""

  // Warning: lucro === faturamento indica dado inconsistente (backend não separou despesas)
  const lucroInconsistente = !loadingKpi && !lucroNulo && lucro > 0 && lucro === faturamento

  // ── alertas derivados ────────────────────────────────────────────────────────
  const alertas = useMemo<AlertaItem[]>(() => {
    const list: AlertaItem[] = []
    const isHoje = diaValido === "" && mes === new Date().getMonth() && ano === new Date().getFullYear()

    if (integrationStatus?.status === "offline" || integrationStatus?.status === "error") {
      list.push({
        id: "integracao-offline",
        tipo: "destructive",
        titulo: "Integração offline",
        mensagem: "Fone Ninja não está respondendo. Os dados podem estar desatualizados.",
      })
    }

    if (isHoje && faturamentoDia === 0 && !loadingKpi) {
      list.push({
        id: "sem-vendas-hoje",
        tipo: "warning",
        titulo: "Sem vendas hoje",
        mensagem: "Nenhuma venda registrada para hoje. Verifique se a integração está sincronizando.",
      })
    }

    if (integrationStatus?.lastSync) {
      const diffMin = (Date.now() - new Date(integrationStatus.lastSync).getTime()) / 60_000
      if (diffMin > 60) {
        list.push({
          id: "sync-atrasado",
          tipo: "warning",
          titulo: "Sincronização atrasada",
          mensagem: `Última sync há ${Math.round(diffMin)} minutos. Dados podem estar defasados.`,
        })
      }
    } else if (!loadingKpi) {
      list.push({
        id: "sync-nunca",
        tipo: "warning",
        titulo: "Sem sincronização registrada",
        mensagem: "Nenhuma sincronização com o Fone Ninja foi registrada ainda.",
      })
    }

    list.push({
      id: "kommo-desconectado",
      tipo: "info",
      titulo: "Leads sem follow-up",
      mensagem: "Kommo CRM ainda não conectado — leads de meses anteriores não podem ser verificados.",
    })

    return list
  }, [integrationStatus, faturamentoDia, loadingKpi, diaValido, mes, ano])

  const dadosGrafico = useMemo(() =>
    (overviewExtra?.grafico ?? []).map((item) => ({
      mes: item.mes,
      dia: item.dia,
      faturamento: Number(item.receita ?? 0),
      despesas:    Number(item.custo   ?? 0),
      lucro:       Number(item.lucro   ?? 0),
    })),
    [overviewExtra]
  )

  // ── tarefas ─────────────────────────────────────────────────────────────────
  const tarefasPorId = useMemo(
    () => new Map([...tarefasHoje, ...tarefasPendentes].map((t) => [t.id, t])),
    [tarefasHoje, tarefasPendentes]
  )

  const concluirTarefa = useCallback(async (id: string) => {
    const tarefa = tarefasPorId.get(id)
    try {
      await backendService.updateTask(id, { status: "CONCLUIDA" })
      notifyTaskCompleted({ taskTitle: tarefa?.title })
      setRiscados((prev) => new Set(prev).add(id))
      setTimeout(() => {
        setConcluidos((prev) => new Set(prev).add(id))
        setRiscados((prev) => { const n = new Set(prev); n.delete(id); return n })
      }, 700)
      return true
    } catch {
      notifyTaskCompletionError()
      return false
    }
  }, [notifyTaskCompleted, notifyTaskCompletionError, tarefasPorId])

  const pendentesVisiveis = useMemo(
    () => tarefasPendentes.filter((t) => !concluidos.has(t.id)),
    [tarefasPendentes, concluidos]
  )
  const hojeVisiveis = useMemo(
    () => tarefasHoje.filter((t) => !concluidos.has(t.id)),
    [tarefasHoje, concluidos]
  )

  const load = (v: string) => loadingKpi ? "…" : v

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Cabeçalho + filtro de período */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Visão geral da operação Guimicell</p>
          {integrationStatus?.lastSync && (
            <Badge className="mt-2 bg-green-100 text-green-800">
              <RefreshCw className="h-3 w-3 mr-1" />
              Sincronizado às {new Date(integrationStatus.lastSync).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </Badge>
          )}
          {loadingKpi && (
            <Badge variant="secondary" className="mt-2 ml-2">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Carregando…
            </Badge>
          )}
          {erroFetch && !loadingKpi && (
            <Badge variant="destructive" className="mt-2 ml-2">
              Erro ao carregar dados — exibindo último resultado
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={String(mes)} onValueChange={(v) => {
            setMes(Number(v))
            setDia("")
          }}>
            <SelectTrigger className="w-[130px] cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              {mesesDisponiveis.map((item) => (
                <SelectItem key={item.value} value={String(item.value)}>{item.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(ano)} onValueChange={(v) => {
            setAno(Number(v))
            setDia("")
          }}>
            <SelectTrigger className="w-[90px] cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              {yearsDisponiveis.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dia === "" ? "all" : String(dia)} onValueChange={(v) => setDia(v === "all" ? "" : Number(v))}>
            <SelectTrigger className="w-[90px] cursor-pointer"><SelectValue placeholder="Dia" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o mês</SelectItem>
              {diasDisponiveis.map((d) => (
                <SelectItem key={d} value={String(d)}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs — exatamente: faturamentoDia, faturamentoMes, lucroLiquido, totalVendasMes */}
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
              titulo="Faturamento do Dia"
              valor={faturamentoDiaNulo ? "Indisponível" : formatBRL(faturamentoDia)}
              descricao={diaValido ? `Dia ${diaValido}` : faturamentoDiaNulo ? "Sem dados do backend" : faturamentoDia > 0 ? "Hoje (real)" : "Aguardando dados"}
              icone={DollarSign}
              tendencia={faturamentoDiaNulo ? "neutral" : "up"}
            />
            <KpiCard
              titulo="Faturamento do Mês"
              valor={formatBRL(faturamento)}
              descricao={`${MESES[mes]} ${ano}`}
              icone={Target}
              tendencia="up"
            />
            <KpiCard
              titulo="Lucro Líquido"
              valor={lucroNulo ? "Indisponível" : lucroInconsistente ? "⚠ Inconsistente" : formatBRL(lucro)}
              descricao={lucroNulo ? "Aguardando custos/despesas" : lucroInconsistente ? "Dado financeiro inconsistente" : "Fat. − despesas − compras"}
              icone={TrendingUp}
              tendencia={lucroNulo ? "neutral" : lucroInconsistente ? "down" : lucro >= 0 ? "up" : "down"}
              destaque
            />
            <KpiCard
              titulo="Total Vendas no Mês"
              valor={totalVendasNulo ? "Indisponível" : totalVendas > 0 ? String(totalVendas) : "—"}
              descricao={totalVendasNulo ? "Sem dados do backend" : "Vendas consolidadas (real)"}
              icone={ShoppingCart}
              tendencia={totalVendasNulo ? "neutral" : "up"}
            />
          </>
        )}
      </div>

      {/* Alertas gerais */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((alerta) => (
            <Alert
              key={alerta.id}
              variant={alerta.tipo === "destructive" ? "destructive" : "default"}
              className={alerta.tipo === "warning" ? "border-yellow-400 bg-yellow-50 text-yellow-900 dark:border-yellow-600 dark:bg-yellow-950 dark:text-yellow-100" : alerta.tipo === "info" ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100" : ""}
            >
              {alerta.tipo === "destructive" && <WifiOff className="h-4 w-4" />}
              {alerta.tipo === "warning" && <AlertTriangle className="h-4 w-4" />}
              {alerta.tipo === "info" && <Users className="h-4 w-4" />}
              <AlertTitle>{alerta.titulo}</AlertTitle>
              <AlertDescription>{alerta.mensagem}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Gráfico faturamento/lucro */}
      {dadosGrafico.length > 0 ? (
        <GraficoFinanceiro dados={dadosGrafico} titulo={`Evolução — ${MESES[mes]} ${ano}`} />
      ) : !loadingKpi ? (
        <GraficoVazio mensagem={`Sem dados de gráfico para ${MESES[mes]} ${ano}`} />
      ) : null}

      {/* Origem dos leads — Kommo CRM (não conectado ainda) */}
      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        <Clock className="mx-auto mb-1 h-4 w-4 opacity-50" />
        Origem dos leads — aguardando conexão com Kommo CRM
      </div>

      {/* Ranking de vendedores */}
      <VendedoresRanking vendedores={overviewExtra?.vendedores ?? []} loading={loadingKpi} />

      {/* Tarefas do dia */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Leaderboard currentUserId={currentUser?.id} compact />
        <PainelTarefas tarefas={pendentesVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
        <PainelCompromissos tarefas={hojeVisiveis} onConcluir={concluirTarefa} riscados={riscados} />
      </div>

    </div>
  )
}
