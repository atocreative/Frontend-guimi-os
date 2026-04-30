const BASE = process.env.FONENINJA_BASE_URL ?? 'https://api.fone.ninja'
const LOJA = process.env.FONENINJA_LOJA_ID ?? 'guimicell'
const LOJAS_BASE = `${BASE}/erp/api/lojas/${LOJA}`

let _cachedToken: string | null = null

function tokenExpired(jwt: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(jwt.split('.')[1], 'base64').toString('utf8'),
    ) as { exp: number }

    return payload.exp <= Math.floor(Date.now() / 1000) + 60
  } catch {
    return true
  }
}

async function getToken(): Promise<string> {
  const envToken = process.env.FONENINJA_TOKEN
  if (envToken && !tokenExpired(envToken)) return envToken
  if (_cachedToken && !tokenExpired(_cachedToken)) return _cachedToken

  const res = await fetch(`${BASE}/auth/api/login`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: 'https://app.fone.ninja',
    },
    body: JSON.stringify({
      email: process.env.FONENINJA_EMAIL,
      password: process.env.FONENINJA_PASSWORD,
    }),
  })

  if (!res.ok) throw new Error(`Fone Ninja login falhou: ${res.status}`)

  const data = (await res.json()) as { payload?: { access_token?: string } }
  const token = data?.payload?.access_token
  if (!token) throw new Error('Fone Ninja: access_token ausente na resposta')

  _cachedToken = token
  return token
}

async function foneninja<T>(path: string, qs: string): Promise<T> {
  const token = await getToken()
  const url = qs ? `${LOJAS_BASE}${path}?${qs}` : `${LOJAS_BASE}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      Origin: 'https://app.fone.ninja',
      Referer: 'https://app.fone.ninja/',
    },
    next: { revalidate: 300 },
  })

  if (!res.ok) throw new Error(`Fone Ninja ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

interface VendaRow {
  id: number
  status: string | null
  valor_total: number | string | null
  custo_total: number | string | null
  canceled_at?: string | null
}

interface VendaProdutoRow {
  valor_estoque?: number | string | null
  custo_total?: number | string | null
}

interface VendaDetalhe extends VendaRow {
  produtos?: VendaProdutoRow[]
}

interface VendasResp {
  data?: VendaRow[]
  payload?: { data?: VendaRow[]; last_page?: number }
  last_page?: number
}

export interface ResumoFinanceiroHoje {
  faturamentoDia: number
  lucroBrutoDia: number
  margemBrutaDia: number
}

function formatApiDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mesAtualBounds() {
  const now = new Date()
  const inicio = formatApiDate(new Date(now.getFullYear(), now.getMonth(), 1))
  const fim = formatApiDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  return { inicio, fim }
}

function hojeBounds() {
  const hoje = formatApiDate(new Date())
  return { inicio: hoje, fim: `${hoje}T23:59:59` }
}

function normalizeVendas(resp: VendasResp): VendaRow[] {
  return resp?.payload?.data ?? resp?.data ?? (Array.isArray(resp) ? resp : [])
}

function toMoneyCents(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value * 100) : 0
  }

  const trimmed = value.trim()
  if (!trimmed) return 0

  const normalized =
    /^-?\d{1,3}(\.\d{3})*,\d+$/.test(trimmed)
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed.includes(',') && !trimmed.includes('.')
        ? trimmed.replace(',', '.')
        : trimmed

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}

function fromMoneyCents(value: number): number {
  return value / 100
}

function isCanceledSale(venda: VendaRow) {
  return venda.canceled_at != null || venda.status?.toLowerCase() === 'canceled'
}

function isCompletedSale(venda: VendaRow) {
  return venda.status?.toLowerCase() === 'completed' && !isCanceledSale(venda)
}

function resolveProdutoCostCents(produto: VendaProdutoRow): number | null {
  if (produto.valor_estoque !== undefined && produto.valor_estoque !== null) {
    return toMoneyCents(produto.valor_estoque)
  }

  if (produto.custo_total !== undefined && produto.custo_total !== null) {
    return toMoneyCents(produto.custo_total)
  }

  return null
}

async function getVendaCostCents(venda: VendaRow): Promise<number> {
  try {
    const detalhe = await foneninja<VendaDetalhe>(`/vendas/${venda.id}`, '')
    const produtos = detalhe.produtos ?? []

    if (produtos.length === 0) {
      return toMoneyCents(detalhe.custo_total)
    }

    let total = 0
    let encontrouCusto = false

    for (const produto of produtos) {
      const custo = resolveProdutoCostCents(produto)
      if (custo === null) continue
      total += custo
      encontrouCusto = true
    }

    return encontrouCusto ? total : toMoneyCents(detalhe.custo_total)
  } catch {
    return toMoneyCents(venda.custo_total)
  }
}

async function listVendasByDateRange(inicio: string, fim: string): Promise<VendaRow[]> {
  const PER_PAGE = 500
  const rows: VendaRow[] = []
  let page = 1

  while (true) {
    const qs =
      `page=${page}&perPage=${PER_PAGE}` +
      `&sortField=data_saida&sortOrder=-1` +
      `&filters%5Bdata_saida%5D%5B%24gte%5D=${inicio}` +
      `&filters%5Bdata_saida%5D%5B%24lte%5D=${fim}`

    const resp = await foneninja<VendasResp>('/vendas', qs)
    const pageRows = normalizeVendas(resp)
    rows.push(...pageRows)

    const lastPage = resp?.payload?.last_page ?? resp?.last_page ?? 1
    if (page >= lastPage || pageRows.length < PER_PAGE) break
    page += 1
  }

  return rows
}

export async function getFaturamentoMes(): Promise<number> {
  const { inicio, fim } = mesAtualBounds()
  const rows = await listVendasByDateRange(inicio, `${fim}T23:59:59`)

  const totalCents = rows.reduce((acc, venda) => {
    if (isCanceledSale(venda)) return acc
    return acc + toMoneyCents(venda.valor_total)
  }, 0)

  return fromMoneyCents(totalCents)
}

export async function getResumoFinanceiroHoje(): Promise<ResumoFinanceiroHoje> {
  const { inicio, fim } = hojeBounds()
  const rows = await listVendasByDateRange(inicio, fim)
  const vendasConcluidas = rows.filter(isCompletedSale)

  const faturamentoDiaCents = vendasConcluidas.reduce((acc, venda) => {
    return acc + toMoneyCents(venda.valor_total)
  }, 0)

  const custos = await Promise.all(vendasConcluidas.map(getVendaCostCents))
  const custoDiaCents = custos.reduce((acc, custo) => acc + custo, 0)

  const lucroBrutoDiaCents = faturamentoDiaCents - custoDiaCents
  const margemBrutaDia =
    faturamentoDiaCents === 0
      ? 0
      : Number(((lucroBrutoDiaCents / faturamentoDiaCents) * 100).toFixed(2))

  return {
    faturamentoDia: fromMoneyCents(faturamentoDiaCents),
    lucroBrutoDia: fromMoneyCents(lucroBrutoDiaCents),
    margemBrutaDia,
  }
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

export async function getVendasPorVendedor(
  startDate: string,
  endDate: string,
): Promise<VendedorMetrica[]> {
  const rows = await listVendasByDateRange(startDate, endDate)
  const vendedorMap = new Map<string, VendedorMetrica>()

  // Process each sale
  for (const venda of rows) {
    if (isCanceledSale(venda)) continue

    const vendedor = 'vendedor_nome' in venda
      ? (venda.vendedor_nome as string | null) || 'Desconhecido'
      : 'Desconhecido'

    const custos = await getVendaCostCents(venda)
    const vendaValue = toMoneyCents(venda.valor_total)
    const lucro = vendaValue - custos

    // Determine if this is an upgrade (would need field from API)
    const isUpgrade = 'tipo' in venda && venda.tipo === 'upgrade'

    let metrica = vendedorMap.get(vendedor)
    if (!metrica) {
      metrica = {
        nomeVendedor: vendedor,
        totalVendas: 0,
        faturamento: 0,
        lucro: 0,
        margemLucro: 0,
        upgrades: 0,
        valorUpgrades: 0,
      }
      vendedorMap.set(vendedor, metrica)
    }

    metrica.totalVendas += 1
    metrica.faturamento += vendaValue
    metrica.lucro += lucro

    if (isUpgrade) {
      metrica.upgrades += 1
      metrica.valorUpgrades += vendaValue
    }
  }

  // Calculate margins and convert from cents
  const result = Array.from(vendedorMap.values()).map((metrica) => ({
    ...metrica,
    margemLucro:
      metrica.faturamento === 0
        ? 0
        : Number(((metrica.lucro / metrica.faturamento) * 100).toFixed(2)),
    faturamento: fromMoneyCents(metrica.faturamento),
    lucro: fromMoneyCents(metrica.lucro),
    valorUpgrades: fromMoneyCents(metrica.valorUpgrades),
  }))

  // Sort by faturamento descending
  return result.sort((a, b) => b.faturamento - a.faturamento)
}

export async function getVendasDia(): Promise<VendedorMetrica[]> {
  const hoje = formatApiDate(new Date())
  return getVendasPorVendedor(hoje, `${hoje}T23:59:59`)
}

export interface MetricasComerciais {
  totalLeads: number
  leadsQualificados: number
  taxaConversao: number
  volumePipeline: number
  ticketMedio: number
}

export async function getMetricasComercia(): Promise<MetricasComerciais> {
  try {
    // Try to fetch from Kommo CRM if available
    // This is a placeholder - actual implementation depends on Kommo API
    const metricas = await foneninja<any>('/metricas/comercial', '')
    return {
      totalLeads: metricas?.total_leads ?? 0,
      leadsQualificados: metricas?.leads_qualificados ?? 0,
      taxaConversao: metricas?.taxa_conversao ?? 0,
      volumePipeline: metricas?.volume_pipeline ?? 0,
      ticketMedio: metricas?.ticket_medio ?? 0,
    }
  } catch {
    // If Kommo endpoint doesn't exist, calculate from sales data
    const { inicio, fim } = mesAtualBounds()
    const vendas = await listVendasByDateRange(inicio, `${fim}T23:59:59`)
    const vendasConcluidas = vendas.filter(isCompletedSale)

    const totalFaturamento = vendasConcluidas.reduce(
      (acc, v) => acc + toMoneyCents(v.valor_total),
      0,
    )

    return {
      totalLeads: vendas.length,
      leadsQualificados: vendasConcluidas.length,
      taxaConversao:
        vendas.length === 0
          ? 0
          : Number(((vendasConcluidas.length / vendas.length) * 100).toFixed(2)),
      volumePipeline: fromMoneyCents(totalFaturamento),
      ticketMedio:
        vendasConcluidas.length === 0
          ? 0
          : fromMoneyCents(Math.round(totalFaturamento / vendasConcluidas.length)),
    }
  }
}
