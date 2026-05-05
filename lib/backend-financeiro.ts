/**
 * Consumidor de dados financeiros do backend local
 * Conforme endpoints2.md: frontend consome backend, backend consome FoneNinja
 *
 * Base URL: http://localhost:3001
 *
 * IMPORTANTE: Usar api client que passa auth token automaticamente!
 */

import { serverApi } from './server-api-client'

export interface ResumoFinanceiroHoje {
  faturamentoDia: number
  lucroBrutoDia: number
  margemBrutaDia: number
}

export interface VendedorMetrica {
  nomeVendedor: string
  totalVendas: number
  faturamento: number
  lucro: number
  margemLucro: number
  upgrades: number
  valorUpgrades: number
}

export interface MetricasComerciais {
  totalLeads: number
  leadsQualificados: number
  taxaConversao: number
  volumePipeline: number
  ticketMedio: number
}

import { backendFetch, getSessionAccessToken } from './backend-api'

/**
 * SERVER-SIDE: Obtém snapshot financeiro diretamente do backend
 */
export async function getSnapshotFinanceiroServer(
  month: number,
  year: number,
  token?: string | null
): Promise<any> {
  try {
    if (!token) {
      console.warn('[getSnapshotFinanceiroServer] Token não fornecido')
      return null
    }

    const { response, data } = await backendFetch(
      `/api/financeiro/snapshot?month=${month}&year=${year}`,
      { token }
    )

    if (!response.ok) {
      console.error('[getSnapshotFinanceiroServer] Resposta não OK:', {
        status: response.status,
        data
      })
      return null
    }

    const snapshot = data?.data || data || null
    console.log('[getSnapshotFinanceiroServer] Snapshot carregado com sucesso:', {
      month,
      year,
      hasData: !!snapshot,
      fields: snapshot ? Object.keys(snapshot) : []
    })
    return snapshot
  } catch (error) {
    console.error('[getSnapshotFinanceiroServer] Erro ao carregar:', error)
    return null
  }
}

/**
 * SERVER-SIDE: Obtém dashboard agregado
 */
export async function getDashboardDataServer(token?: string): Promise<any> {
  try {
    if (!token) {
      console.warn('[getDashboardDataServer] Token não fornecido')
      return null
    }

    const { response, data } = await backendFetch('/api/dashboard', { token })

    if (!response.ok) {
      console.error('[getDashboardDataServer] Resposta não OK:', {
        status: response.status,
        data
      })
      return null
    }

    const dashboard = data?.data || data || null
    console.log('[getDashboardDataServer] Dashboard carregado com sucesso:', {
      hasData: !!dashboard,
      fields: dashboard ? Object.keys(dashboard) : []
    })
    return dashboard
  } catch (error) {
    console.error('[getDashboardDataServer] Erro ao carregar:', error)
    return null
  }
}

/**
 * Sincroniza receitas com FoneNinja via backend
 * POST /api/financeiro/sync/feneninja
 */
export async function syncFoneNinjaReceitas(): Promise<{ success: boolean; synced?: number; error?: string }> {
  try {
    // Use server api client para passar auth token do servidor
    const response = await serverApi.syncFoneNinja()
    const responseData = response && typeof response === 'object' ? response as { synced?: number } : {}
    return { success: true, synced: responseData.synced || 0 }
  } catch (error) {
    console.error('Erro ao sincronizar FoneNinja:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

export interface FinanceiroSummary {
  data: import('@/lib/financeiro-utils').SaleItem[]
  count: number
  resumo: {
    faturamentoMes: number
    despesasMes: number
    lucroLiquidoMes: number
    totalVendas: number
  }
  grafico: Array<{
    data: string
    entradas: number
    saidas: number
    saldo: number
  }>
  periodo: { startDate: string; endDate: string }
}

/**
 * SERVER-SIDE: Obtém summary financeiro do mês corrente.
 * Backend retorna: { data, count, resumo, grafico, periodo }
 * Frontend consome direto — sem cálculos adicionais.
 */
export async function getFinanceiroSummaryServer(
  token?: string | null
): Promise<FinanceiroSummary | null> {
  if (!token) {
    console.warn('[getFinanceiroSummaryServer] Token não fornecido')
    return null
  }

  const { getMonthRange, filtersToSearchParams, buildSalesFilters } =
    await import('@/lib/financeiro-utils')

  const { startDate, endDate } = getMonthRange()
  const filters = buildSalesFilters({ startDate, endDate })
  const params = filtersToSearchParams(filters)

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  console.log('[FRONT FINANCEIRO] Fetching sales...', { url: `${apiBase}/api/financeiro/sales?${params.toString()}` })

  const salesRes = await fetch(
    `${apiBase}/api/financeiro/sales?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    }
  ).catch((err) => {
    console.error('[FRONT FINANCEIRO] Sales network error:', (err as Error).message)
    return null
  })

  if (!salesRes) {
    console.warn('[FRONT FINANCEIRO] Nenhuma resposta do endpoint sales (network error)')
    return null
  }

  if (!salesRes.ok) {
    console.warn(`[FRONT FINANCEIRO] /api/financeiro/sales retornou ${salesRes.status}`)
    return null
  }

  const salesData = await salesRes.json().catch(() => null)
  if (!salesData) {
    console.warn('[FRONT FINANCEIRO] Falha ao parsear resposta do sales')
    return null
  }

  console.log('[FRONT FINANCEIRO] resumo:', salesData?.resumo)
  console.log('[FRONT FINANCEIRO] grafico:', salesData?.grafico?.length)
  console.log('[FRONT FINANCEIRO] vendas:', salesData?.data?.length)

  // Backend retorna contrato novo com resumo e grafico calculados
  return {
    data: salesData?.data ?? [],
    count: salesData?.count ?? 0,
    resumo: {
      faturamentoMes: Number(salesData?.resumo?.faturamentoMes ?? 0),
      despesasMes: Number(salesData?.resumo?.despesasMes ?? 0),
      lucroLiquidoMes: Number(salesData?.resumo?.lucroLiquidoMes ?? 0),
      totalVendas: Number(salesData?.resumo?.totalVendas ?? 0),
    },
    grafico: Array.isArray(salesData?.grafico) ? salesData.grafico : [],
    periodo: salesData?.periodo ?? { startDate, endDate },
  }
}

/**
 * Obtém receitas de um período
 * GET /api/financeiro/receitas?month=4&year=2026
 */
export async function getReceitasPeriodo(month: number, year: number): Promise<any[]> {
  try {
    const data = await serverApi.getFinanceiroReceitas(month, year)
    if (!data || typeof data !== 'object') return []
    const payload = data as { data?: any[] }
    return payload.data || (Array.isArray(data) ? data : [])
  } catch (error) {
    console.error('Erro ao carregar receitas:', error)
    return []
  }
}

/**
 * Obtém snapshot financeiro completo para um período
 * GET /api/financeiro/snapshot?month=4&year=2026
 */
export async function getSnapshotFinanceiro(month: number, year: number): Promise<any> {
  try {
    const data = await serverApi.getFinanceiroSnapshot(month, year)
    if (!data || typeof data !== 'object') return null
    const payload = data as { data?: any }
    return payload.data || data || null
  } catch (error) {
    console.error('Erro ao carregar snapshot financeiro:', error)
    return null
  }
}

/**
 * Obtém dashboard agregado com dados do FoneNinja
 * GET /dashboard
 */
export async function getDashboardData(): Promise<any> {
  try {
    const data = await serverApi.getDashboard()
    if (!data || typeof data !== 'object') return null
    const payload = data as { data?: any }
    return payload.data || data || null
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
    return null
  }
}

/**
 * Retorna dados de faturamento do mês atual
 * Usa data cacheada ou sincroniza se necessário
 */
export async function getFaturamentoMes(): Promise<number> {
  try {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // Primeiro, tenta sincronizar os dados mais recentes
    await syncFoneNinjaReceitas()

    // Depois, busca os dados
    const snapshot = await getSnapshotFinanceiro(month, year)

    if (snapshot?.totalReceitas) {
      return snapshot.totalReceitas
    }

    // Fallback para endpoint de receitas
    const receitas = await getReceitasPeriodo(month, year)
    return receitas.reduce((acc, r) => acc + (r.amount || 0), 0)
  } catch (error) {
    console.error('Erro ao obter faturamento do mês:', error)
    return 0
  }
}

/**
 * Retorna resumo financeiro de hoje
 * Basicamente: faturamento do dia, lucro bruto, margem bruta
 */
export async function getResumoFinanceiroHoje(): Promise<ResumoFinanceiroHoje> {
  try {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // Sincroniza dados
    await syncFoneNinjaReceitas()

    // Tenta obter snapshot que pode incluir dados de hoje
    const snapshot = await getSnapshotFinanceiro(month, year)

    // Por enquanto, retorna valores do dashboard agregado
    // Quando o backend tiver dados diários detalhados, este será preenchido corretamente
    return {
      faturamentoDia: snapshot?.todayRevenue || 0,
      lucroBrutoDia: snapshot?.todayProfit || 0,
      margemBrutaDia: snapshot?.todayMargin || 0,
    }
  } catch (error) {
    console.error('Erro ao obter resumo financeiro de hoje:', error)
    return {
      faturamentoDia: 0,
      lucroBrutoDia: 0,
      margemBrutaDia: 0,
    }
  }
}

/**
 * Obtém vendas por vendedor em um período
 * Quando o backend expor este endpoint, consumir daqui
 * Por enquanto, retorna dados agregados do dashboard
 */
export async function getVendasPorVendedor(startDate: string, endDate: string): Promise<VendedorMetrica[]> {
  try {
    // Parse datas para extrair month/year
    const start = new Date(startDate)
    const month = start.getMonth() + 1
    const year = start.getFullYear()

    // Sincroniza dados
    await syncFoneNinjaReceitas()

    // Busca snapshot com dados de vendas
    const snapshot = await getSnapshotFinanceiro(month, year)

    // Mapeia dados do snapshot para VendedorMetrica se disponível
    if (snapshot?.vendedores && Array.isArray(snapshot.vendedores)) {
      return snapshot.vendedores.map((v: any) => ({
        nomeVendedor: v.name || v.nomeVendedor || 'Desconhecido',
        totalVendas: v.salesCount || v.totalVendas || 0,
        faturamento: v.totalRevenue || v.faturamento || 0,
        lucro: v.totalProfit || v.lucro || 0,
        margemLucro: v.marginPercent || v.margemLucro || 0,
        upgrades: v.upgrades || 0,
        valorUpgrades: v.valueUpgrades || 0,
      }))
    }

    return []
  } catch (error) {
    console.error('Erro ao obter vendas por vendedor:', error)
    return []
  }
}

/**
 * Obtém vendas de hoje
 * Convenience wrapper para getVendasPorVendedor
 */
export async function getVendasDia(): Promise<VendedorMetrica[]> {
  const hoje = new Date()
  const dataFormatada = hoje.toISOString().split('T')[0]
  return getVendasPorVendedor(dataFormatada, `${dataFormatada}T23:59:59`)
}

/**
 * Obtém métricas comerciais
 * GET /api/comercial/leads ou similar quando disponível
 */
export async function getMetricasComercia(): Promise<MetricasComerciais> {
  try {
    // Por enquanto, retorna dados agregados do dashboard
    const snapshot = await getDashboardData()

    if (snapshot?.comercial) {
      return {
        totalLeads: snapshot.comercial.totalLeads || 0,
        leadsQualificados: snapshot.comercial.leadsQualificados || 0,
        taxaConversao: snapshot.comercial.taxaConversao || 0,
        volumePipeline: snapshot.comercial.volumePipeline || 0,
        ticketMedio: snapshot.comercial.ticketMedio || 0,
      }
    }

    return {
      totalLeads: 0,
      leadsQualificados: 0,
      taxaConversao: 0,
      volumePipeline: 0,
      ticketMedio: 0,
    }
  } catch (error) {
    console.error('Erro ao obter métricas comerciais:', error)
    return {
      totalLeads: 0,
      leadsQualificados: 0,
      taxaConversao: 0,
      volumePipeline: 0,
      ticketMedio: 0,
    }
  }
}
