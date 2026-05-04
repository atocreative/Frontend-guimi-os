/**
 * Indicadores Repository
 * Fetch employee and team performance indicators from backend or Fone Ninja
 */

import { serverApi } from './server-api-client'
import { getVendasPorVendedor } from './backend-financeiro'

export interface IndicadorColaborador {
  id: string
  nome: string
  avatar: string
  role: 'ADMIN' | 'GESTOR' | 'COLABORADOR'
  vendasMes: number
  faturamentoMes: number
  ticketMedio: number
  taxaConversao: number
  leadsAtivos: number
  metaMes: number
  percentualMeta: number
  medalhas: string[]
}

export interface EvolucaoIndicador {
  data: string
  vendas: number
  faturamento: number
  lucro: number
}

/**
 * Get all employee performance indicators
 * Combines data from backend (user info) and Fone Ninja (sales data)
 */
export async function getIndicadoresTime(): Promise<IndicadorColaborador[]> {
  try {
    // Fetch users from backend
    const response = await serverApi.getUsers()
    const usuarios = (response && typeof response === 'object' ? (response as { users?: any[] }).users : null) || []

    if (!usuarios || usuarios.length === 0) {
      return []
    }

    // Fetch sales data from Fone Ninja for current month
    const hoje = new Date()
    const startDate = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
    const endDate = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`

    const vendasPorVendedor = await getVendasPorVendedor(startDate, endDate)

    // Map users to indicators
    const indicadores: IndicadorColaborador[] = usuarios.map((user) => {
      const vendas = vendasPorVendedor.find(
        (v) => v.nomeVendedor.toLowerCase() === user.name.toLowerCase(),
      )

      const metaMes = 50000 // Default goal
      const percentualMeta = vendas
        ? Math.round((vendas.faturamento / metaMes) * 100)
        : 0

      return {
        id: user.id,
        nome: user.name,
        avatar: user.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        role: (user.role as 'ADMIN' | 'GESTOR' | 'COLABORADOR') || 'COLABORADOR',
        vendasMes: vendas?.totalVendas || 0,
        faturamentoMes: vendas?.faturamento || 0,
        ticketMedio: vendas?.totalVendas ? vendas.faturamento / vendas.totalVendas : 0,
        taxaConversao: 0, // Would need lead data
        leadsAtivos: 0, // Would need Kommo CRM data
        metaMes,
        percentualMeta,
        medalhas: percentualMeta >= 100 ? ['meta-atingida'] : [],
      }
    })

    return indicadores.sort((a, b) => b.faturamentoMes - a.faturamentoMes)
  } catch (error) {
    console.error('Erro ao buscar indicadores:', error)
    return []
  }
}

/**
 * Get historical evolution of team indicators
 * With timeout protection to prevent infinite loading
 */
export async function getEvolucaoIndicadores(
  dias: number = 30,
): Promise<EvolucaoIndicador[]> {
  try {
    const evolucao: EvolucaoIndicador[] = []
    const hoje = new Date()

    // Limit to last 7 days to prevent timeout
    const diasLimite = Math.min(dias, 7)

    for (let i = diasLimite; i >= 0; i--) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)

      const dataStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`

      try {
        // Add timeout protection
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: API não respondeu em tempo')), 5000)
        })

        const vendas = await Promise.race([
          getVendasPorVendedor(dataStr, `${dataStr}T23:59:59`),
          timeoutPromise
        ]) as any

        const totalVendas = vendas.reduce((acc: number, v: any) => acc + v.totalVendas, 0)
        const totalFaturamento = vendas.reduce((acc: number, v: any) => acc + v.faturamento, 0)
        const totalLucro = vendas.reduce((acc: number, v: any) => acc + v.lucro, 0)

        evolucao.push({
          data: dataStr,
          vendas: totalVendas,
          faturamento: totalFaturamento,
          lucro: totalLucro,
        })
      } catch (error) {
        // Skip days with API errors
        console.warn(`Falha ao buscar vendas de ${dataStr}:`, error)
        evolucao.push({
          data: dataStr,
          vendas: 0,
          faturamento: 0,
          lucro: 0,
        })
      }
    }

    return evolucao
  } catch (error) {
    console.error('Erro ao buscar evolução de indicadores:', error)
    return []
  }
}

/**
 * Get team summary statistics
 */
export interface ResumoTime {
  totalVendas: number
  faturamentoTotal: number
  lucroTotal: number
  ticketMedioTime: number
  topVendedor: {
    nome: string
    vendas: number
    faturamento: number
  } | null
}

export async function getResumoTime(): Promise<ResumoTime> {
  try {
    const indicadores = await getIndicadoresTime()

    const totalVendas = indicadores.reduce((acc, ind) => acc + ind.vendasMes, 0)
    const faturamentoTotal = indicadores.reduce((acc, ind) => acc + ind.faturamentoMes, 0)
    const lucroTotal = faturamentoTotal * 0.1 // Approximate, would need actual costs

    const topVendedor = indicadores[0]
      ? {
          nome: indicadores[0].nome,
          vendas: indicadores[0].vendasMes,
          faturamento: indicadores[0].faturamentoMes,
        }
      : null

    return {
      totalVendas,
      faturamentoTotal,
      lucroTotal,
      ticketMedioTime: totalVendas > 0 ? faturamentoTotal / totalVendas : 0,
      topVendedor,
    }
  } catch (error) {
    console.error('Erro ao buscar resumo do time:', error)
    return {
      totalVendas: 0,
      faturamentoTotal: 0,
      lucroTotal: 0,
      ticketMedioTime: 0,
      topVendedor: null,
    }
  }
}
