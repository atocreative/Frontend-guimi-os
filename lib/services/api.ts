import { backendService } from "./backend-service"

export interface IndicadoresGeral {
  faturamento: number
  despesas: number
  compras: number
  lucro: number
  ticketMedio: number
  estoqueTotal: number
  conversao: number
}

export interface OverviewGraficoItem {
  mes?: string
  dia?: string
  receita: number
  custo: number
  lucro: number
}

export interface OverviewVendedor {
  nome?: string
  name?: string
  faturamento?: number
  totalVendas?: number
  vendas?: number
  ticketMedio?: number
  ticket?: number
}

export interface OverviewExtra {
  grafico: OverviewGraficoItem[]
  vendedores?: OverviewVendedor[]
  resumo?: { faturamentoDia?: number }
}

export interface DashboardData {
  indicadores: IndicadoresGeral
  overview: OverviewExtra
}

/**
 * Busca dados financeiros consolidados do dashboard
 * Combina indicadores gerais com overview extra
 */
export async function getDashboardData(startDate: string, endDate: string): Promise<DashboardData> {
  const qs = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`

  const [kpiRes, overviewRes] = await Promise.all([
    fetch(`/api/indicadores/geral?${qs}`),
    fetch(`/api/financeiro/overview?${qs}`),
  ])

  // Parse KPI response
  const kpi: IndicadoresGeral = {
    faturamento: 0,
    despesas: 0,
    compras: 0,
    lucro: 0,
    ticketMedio: 0,
    estoqueTotal: 0,
    conversao: 0,
  }

  if (kpiRes.ok) {
    const kpiData = await kpiRes.json()
    Object.assign(kpi, {
      faturamento: Number(kpiData.faturamento ?? 0),
      despesas: Number(kpiData.despesas ?? 0),
      compras: Number(kpiData.compras ?? 0),
      lucro: Number(kpiData.lucro ?? 0),
      ticketMedio: Number(kpiData.ticketMedio ?? 0),
      estoqueTotal: Number(kpiData.estoqueTotal ?? 0),
      conversao: Number(kpiData.conversao ?? 0),
    })
  }

  // Parse overview response
  const overview: OverviewExtra = {
    grafico: [],
    vendedores: undefined,
    resumo: undefined,
  }

  if (overviewRes.ok) {
    const ovData = await overviewRes.json()
    overview.grafico = Array.isArray(ovData?.grafico) ? ovData.grafico : []
    overview.vendedores = ovData?.vendedores
    overview.resumo = ovData?.resumo
  }

  return {
    indicadores: kpi,
    overview,
  }
}

/**
 * Busca apenas os indicadores gerais (KPIs)
 */
export async function getIndicadores(startDate: string, endDate: string): Promise<IndicadoresGeral> {
  const qs = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
  const res = await fetch(`/api/indicadores/geral?${qs}`)

  if (!res.ok) {
    return {
      faturamento: 0,
      despesas: 0,
      compras: 0,
      lucro: 0,
      ticketMedio: 0,
      estoqueTotal: 0,
      conversao: 0,
    }
  }

  const data = await res.json()
  return {
    faturamento: Number(data.faturamento ?? 0),
    despesas: Number(data.despesas ?? 0),
    compras: Number(data.compras ?? 0),
    lucro: Number(data.lucro ?? 0),
    ticketMedio: Number(data.ticketMedio ?? 0),
    estoqueTotal: Number(data.estoqueTotal ?? 0),
    conversao: Number(data.conversao ?? 0),
  }
}

/**
 * Busca apenas o overview extra (gráficos, vendedores, resumo)
 */
export async function getOverview(startDate: string, endDate: string): Promise<OverviewExtra> {
  const qs = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
  const res = await fetch(`/api/financeiro/overview?${qs}`)

  if (!res.ok) {
    return {
      grafico: [],
      vendedores: undefined,
      resumo: undefined,
    }
  }

  const data = await res.json()
  return {
    grafico: Array.isArray(data?.grafico) ? data.grafico : [],
    vendedores: data?.vendedores,
    resumo: data?.resumo,
  }
}

/**
 * Busca inventário de estoque
 */
export interface InventarioResponse {
  totalEstoque: number
  itens: InventarioItem[]
}

export interface InventarioItem {
  id?: string | number
  product_name?: string
  nome?: string
  quantidade?: number
  stock?: number
  valorUnitario?: number
  valor_unitario?: number
  valor_estoque?: number
  valorTotal?: number
  [key: string]: unknown
}

export async function getInventario(): Promise<InventarioResponse> {
  try {
    const res = await fetch("/api/operacao/inventory")
    if (!res.ok) {
      return { totalEstoque: 0, itens: [] }
    }
    return await res.json()
  } catch (error) {
    console.error("Erro ao buscar inventário:", error)
    return { totalEstoque: 0, itens: [] }
  }
}
