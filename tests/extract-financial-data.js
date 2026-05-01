#!/usr/bin/env node

/**
 * Script para extrair dados financeiros da API e gerar mini-relatório
 * Uso: node tests/extract-financial-data.js
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345'

async function login() {
  console.log('🔐 Fazendo login...')

  try {
    // Obter CAPTCHA
    const captchaRes = await fetch(`${BACKEND_URL}/api/auth/captcha`)
    const captchaData = await captchaRes.json()
    const captchaToken = captchaData.data?.token

    if (!captchaToken) {
      throw new Error('CAPTCHA token não obtido')
    }

    console.log('📝 CAPTCHA obtido')

    // Resolver CAPTCHA (simples)
    const question = captchaData.data?.question || ''
    let captchaAnswer = '0'

    // Tentar resolver a questão
    const match = question.match(/(\d+)\s*([\+\-])\s*(\d+)/)
    if (match) {
      const [_, a, op, b] = match
      captchaAnswer = op === '+' ? String(parseInt(a) + parseInt(b)) : String(parseInt(a) - parseInt(b))
    }

    // Fazer login
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        captchaToken,
        captchaAnswer,
      }),
    })

    const loginData = await loginRes.json()

    if (!loginRes.ok) {
      throw new Error(`Login falhou: ${loginData.error || loginRes.statusText}`)
    }

    // Extrair token da resposta (pode estar em data.data.accessToken ou data.accessToken)
    const token =
      loginData.data?.data?.accessToken ||
      loginData.data?.accessToken ||
      loginData.accessToken

    if (!token) {
      console.error('Resposta de login:', JSON.stringify(loginData, null, 2))
      throw new Error('Token não encontrado na resposta de login')
    }

    console.log('✅ Login realizado com sucesso')
    return token
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message)
    throw error
  }
}

async function getFinancialSnapshot(token, month, year) {
  console.log(`📊 Obtendo dados financeiros para ${month}/${year}...`)

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/financeiro/snapshot?month=${month}&year=${year}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (!res.ok) {
      console.warn(`⚠️ Erro ao obter dados de ${month}/${year}: ${res.status}`)
      return null
    }

    const data = await res.json()

    // Extrair dados da resposta (pode estar em diferentes formatos)
    const snapshot = data.data || data

    return {
      faturamento: parseFloat(
        snapshot.receita ||
          snapshot.totalRevenue ||
          snapshot.faturamento ||
          '0'
      ),
      despesasVariaveis: parseFloat(
        snapshot.despesasVariaveis || snapshot.expenses || '0'
      ),
      despesasFixas: parseFloat(
        snapshot.fixedExpensesTotal || snapshot.expenseFixed || '0'
      ),
      lucroBruto: parseFloat(snapshot.grossProfit || snapshot.lucrobruto || '0'),
      lucroLiquido: parseFloat(
        snapshot.netProfit || snapshot.lucroliquido || '0'
      ),
    }
  } catch (error) {
    console.error(`❌ Erro ao obter snapshot de ${month}/${year}:`, error.message)
    return null
  }
}

async function getDashboard(token) {
  console.log('📈 Obtendo dados do dashboard...')

  try {
    const res = await fetch(`${BACKEND_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      console.warn(`⚠️ Dashboard retornou ${res.status}`)
      return null
    }

    const data = await res.json()
    return data.data || data
  } catch (error) {
    console.error('❌ Erro ao obter dashboard:', error.message)
    return null
  }
}

function formatCurrency(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(num)
}

async function main() {
  console.log('\n🚀 === EXTRATOR DE DADOS FINANCEIROS ===\n')

  try {
    // 1. Fazer login
    const token = await login()

    // 2. Obter mês atual e anterior
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonth = lastMonthDate.getMonth() + 1
    const lastYear = lastMonthDate.getFullYear()

    // 3. Buscar dados
    const [currentData, lastData, dashboardData] = await Promise.all([
      getFinancialSnapshot(token, currentMonth, currentYear),
      getFinancialSnapshot(token, lastMonth, lastYear),
      getDashboard(token),
    ])

    // 4. Gerar relatório
    const monthNames = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
      now
    )
    const lastMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
      lastMonthDate
    )

    console.log('\n' + '='.repeat(60))
    console.log('📊 MINI RELATÓRIO FINANCEIRO')
    console.log('='.repeat(60) + '\n')

    console.log(`📅 Data do Relatório: ${now.toLocaleDateString('pt-BR')}`)
    console.log(
      `🏢 Período: ${monthNames.toUpperCase()}/${currentYear}\n`
    )

    // ========== MÊS ATUAL ==========
    console.log('💰 MÊS ATUAL (' + monthNames.toUpperCase() + ')')
    console.log('-'.repeat(60))

    if (currentData) {
      console.log(
        `Faturamento:          ${formatCurrency(currentData.faturamento)}`
      )
      console.log(
        `Despesas Variáveis:   ${formatCurrency(currentData.despesasVariaveis)}`
      )
      console.log(
        `Despesas Fixas:       ${formatCurrency(currentData.despesasFixas)}`
      )
      console.log(
        `Total de Despesas:    ${formatCurrency(currentData.despesasVariaveis + currentData.despesasFixas)}`
      )
      console.log('-'.repeat(60))
      console.log(
        `💵 Lucro Bruto:        ${formatCurrency(currentData.lucroBruto)}`
      )
      console.log(
        `💵 Lucro Líquido:      ${formatCurrency(currentData.lucroLiquido)}`
      )

      if (currentData.faturamento > 0) {
        const margemBruta = (
          (currentData.lucroBruto / currentData.faturamento) *
          100
        ).toFixed(2)
        const margemLiquida = (
          (currentData.lucroLiquido / currentData.faturamento) *
          100
        ).toFixed(2)
        console.log(`📊 Margem Bruta:       ${margemBruta}%`)
        console.log(`📊 Margem Líquida:     ${margemLiquida}%`)
      }
    } else {
      console.log('⚠️  Dados não disponíveis para o mês atual')
    }

    console.log()

    // ========== MÊS ANTERIOR ==========
    console.log('💰 MÊS ANTERIOR (' + lastMonthName.toUpperCase() + ')')
    console.log('-'.repeat(60))

    if (lastData) {
      console.log(`Faturamento:          ${formatCurrency(lastData.faturamento)}`)
      console.log(
        `Despesas Variáveis:   ${formatCurrency(lastData.despesasVariaveis)}`
      )
      console.log(
        `Despesas Fixas:       ${formatCurrency(lastData.despesasFixas)}`
      )
      console.log(
        `Total de Despesas:    ${formatCurrency(lastData.despesasVariaveis + lastData.despesasFixas)}`
      )
      console.log('-'.repeat(60))
      console.log(`💵 Lucro Bruto:        ${formatCurrency(lastData.lucroBruto)}`)
      console.log(
        `💵 Lucro Líquido:      ${formatCurrency(lastData.lucroLiquido)}`
      )

      if (lastData.faturamento > 0) {
        const margemBruta = (
          (lastData.lucroBruto / lastData.faturamento) *
          100
        ).toFixed(2)
        const margemLiquida = (
          (lastData.lucroLiquido / lastData.faturamento) *
          100
        ).toFixed(2)
        console.log(`📊 Margem Bruta:       ${margemBruta}%`)
        console.log(`📊 Margem Líquida:     ${margemLiquida}%`)
      }
    } else {
      console.log('⚠️  Dados não disponíveis para o mês anterior')
    }

    console.log()

    // ========== COMPARATIVO ==========
    if (
      currentData &&
      lastData &&
      currentData.faturamento > 0 &&
      lastData.faturamento > 0
    ) {
      console.log('📈 COMPARATIVO MÊS A MÊS')
      console.log('-'.repeat(60))

      const crescimentoFaturamento = (
        ((currentData.faturamento - lastData.faturamento) /
          lastData.faturamento) *
        100
      ).toFixed(2)
      const crescimentoLucro = (
        ((currentData.lucroLiquido - lastData.lucroLiquido) /
          Math.abs(lastData.lucroLiquido || 1)) *
        100
      ).toFixed(2)

      const sinal1 = parseFloat(crescimentoFaturamento) > 0 ? '📈' : '📉'
      const sinal2 = parseFloat(crescimentoLucro) > 0 ? '📈' : '📉'

      console.log(
        `${sinal1} Crescimento de Faturamento: ${crescimentoFaturamento}%`
      )
      console.log(`${sinal2} Crescimento de Lucro: ${crescimentoLucro}%`)
    }

    console.log()
    console.log('='.repeat(60))
    console.log('✅ RELATÓRIO GERADO COM SUCESSO')
    console.log('='.repeat(60) + '\n')
  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    process.exit(1)
  }
}

main()
