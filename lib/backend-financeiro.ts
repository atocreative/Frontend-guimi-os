/**
 * Consumidor de dados financeiros do backend local
 * Conforme endpoints2.md: frontend consome backend, backend consome FoneNinja
 *
 * Base URL: http://localhost:3001
 *
 * IMPORTANTE: Usar api client que passa auth token automaticamente!
 */

import { api } from './api-client'

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

/**
 * Sincroniza receitas com FoneNinja via backend
 * POST /api/financeiro/sync/feneninja
 */
export async function syncFoneNinjaReceitas(): Promise<{ success: boolean; synced?: number; error?: string }> {
  try {
    // Use api client para passar auth token automaticamente
    const response = await api.syncFoneNinja()
    return { success: true, synced: response?.synced || 0 }
  } catch (error) {
    console.error('Erro ao sincronizar FoneNinja:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

/**
 * Obtém receitas de um período
 * GET /api/financeiro/receitas?month=4&year=2026
 */
export async function getReceitasPeriodo(month: number, year: number): Promise<any[]> {
  try {
    const data = await api.getFinanceiroReceitas(month, year)
    return data?.data || data || []
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
    const data = await api.getFinanceiroSnapshot(month, year)
    return data?.data || data || null
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
    const data = await api.getDashboard()
    return data?.data || data || null
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
