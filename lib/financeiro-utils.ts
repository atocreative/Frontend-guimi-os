/**
 * Utilitários financeiros — funções puras, sem side-effects, sem chamadas HTTP
 */

const MESES_LABEL = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
]

/**
 * Retorna o label de período para cards e headers.
 * - dia selecionado      → "14/05/2026"
 * - mês/ano = hoje       → "Hoje"
 * - outro mês            → "Maio 2026"
 */
export function getPeriodoLabel(params: {
  dia?: number | null
  mes: number      // 0-indexed
  ano: number
  mesAtual: number // 0-indexed
  anoAtual: number
}): string {
  const { dia, mes, ano, mesAtual, anoAtual } = params
  if (dia) {
    const d = String(dia).padStart(2, "0")
    const m = String(mes + 1).padStart(2, "0")
    return `${d}/${m}/${ano}`
  }
  if (mes === mesAtual && ano === anoAtual) return "Hoje"
  return `${MESES_LABEL[mes]} ${ano}`
}

export const formatBRL = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)

/**
 * Metadados unificados para o card "Faturamento do Dia".
 * Fonte única de verdade para Dashboard e Financeiro.
 *
 * - dia selecionado  → "22/05/2026 · Lucro Líquido R$ 4.100,00"
 * - hoje sem dia     → "Hoje · Lucro Líquido R$ 1.200,00"
 * - mês sem dia      → "Maio 2026"
 */
export function getDailyCardMeta(params: {
  dia?: number | null
  mes: number       // 0-indexed
  ano: number
  mesAtual: number  // 0-indexed
  anoAtual: number
  diaAtual: number
  lucroLiquidoDia?: number | null  // kept for API compatibility, not displayed
}): { descricao: string; isToday: boolean } {
  const { dia, mes, ano, mesAtual, anoAtual, diaAtual } = params

  const isToday = !dia && mes === mesAtual && ano === anoAtual

  // Sem dia selecionado e não é o mês atual → sem contexto diário
  if (!dia && !isToday) {
    return { descricao: `${MESES_LABEL[mes]} ${ano}`, isToday: false }
  }

  const periodoStr = isToday
    ? `Hoje (${String(diaAtual).padStart(2, "0")}/${String(mesAtual + 1).padStart(2, "0")})`
    : (() => {
        const d = String(dia!).padStart(2, "0")
        const m = String(mes + 1).padStart(2, "0")
        return `${d}/${m}/${ano}`
      })()

  return { descricao: periodoStr, isToday }
}

export interface SalesFilters {
  startDate: string
  endDate: string
  status?: string[]
}

export interface SaleItem {
  valor_total?: number
  lucro_bruto?: number
  lucro_financeiro?: number
  data_saida?: string
  preco?: number
  valor?: number
  amount?: number
  totalPrice?: number
  price?: number
}

/**
 * Retorna o range ISO do mês corrente (ou do mês passado com offset=-1)
 */
export function getMonthRange(offset = 0, base = new Date()): { startDate: string; endDate: string } {
  const year = base.getFullYear()
  const month = base.getMonth() + offset

  const start = new Date(year, month, 1, 0, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

/**
 * Monta os query params para o endpoint de vendas do backend/FoneNinja
 */
export function buildSalesFilters({ startDate, endDate }: { startDate: string; endDate: string }): SalesFilters {
  return {
    startDate,
    endDate,
    status: ["completed", "pending", "canceled"],
  }
}

/**
 * Calcula receita total de um array de vendas.
 * Tenta múltiplos campos canônicos sem fallback silencioso.
 */
export function calculateRevenue(sales: SaleItem[]): number {
  return sales.reduce((acc, sale) => {
    const value =
      sale.preco ??
      sale.valor ??
      sale.amount ??
      sale.totalPrice ??
      sale.price ??
      0
    return acc + Number(value)
  }, 0)
}

export interface GraficoItem {
  data: string
  entradas: number
  saidas: number
  saldo: number
}

export interface ResumoHoje {
  faturamentoDia: number
  lucroBrutoDia: number
  margemBrutaDia: number
}

/**
 * Extrai KPIs do dia atual a partir do array grafico retornado pelo backend.
 * Compara pela data local no formato YYYY-MM-DD.
 * Retorna null se não houver entrada para hoje.
 */
export function getResumoHoje(grafico: unknown): ResumoHoje | null {
  if (!Array.isArray(grafico) || grafico.length === 0) return null

  const hoje = new Date()
  const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`

  const dia = (grafico as GraficoItem[]).find((item) => item.data === dataHoje)
  if (!dia) return null

  const entradas = Number(dia.entradas ?? 0)
  const saldo = Number(dia.saldo ?? 0)

  return {
    faturamentoDia: entradas,
    lucroBrutoDia: saldo,
    margemBrutaDia: entradas > 0 ? (saldo / entradas) * 100 : 0,
  }
}

/**
 * Serializa SalesFilters para URLSearchParams
 */
export function filtersToSearchParams(filters: SalesFilters): URLSearchParams {
  const params = new URLSearchParams()
  params.set("startDate", filters.startDate)
  params.set("endDate", filters.endDate)
  if (filters.status) {
    filters.status.forEach((s) => params.append("status", s))
  }
  return params
}
