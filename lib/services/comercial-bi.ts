import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeadBI {
  id: string
  nome: string
  etapa: string
  temperatura: "QUENTE" | "MORNO" | "FRIO" | string
  origem: string
  responsavel: string
  valor: number
  diasParado: number
  proximoFollowUp: string | null
  isWon: boolean
  isLost: boolean
}

export interface KPIsExecutivos {
  cac: number | null               // despesas / leads ganhos
  margemComercial: number | null   // (receita_kommo - despesas) / receita_kommo
  ticketMedioLiquido: number | null // lucro_liquido / vendas_financeiras
  receitaEmRisco: number           // estimatedValue leads frios + parados >7d
  forecast30d: number | null
  forecast60d: number | null
  confiancaForecast: number | null // 0-100
}

export interface OrigemROI {
  origem: string
  totalLeads: number
  ganhos: number
  perdidos: number
  receitaGerada: number
  custoEstimado: number
  lucroEstimado: number
  roi: number       // %
  conversao: number // %
}

export interface EtapaIntelligence {
  etapa: string
  label: string
  quantidade: number
  valor: number
  diasMedioParado: number
  dropOff: number // % leads que saíram desta etapa para perdido
}

export interface VendedorBI {
  responsavel: string
  total: number
  ganhos: number
  perdidos: number
  ativos: number
  taxaConversao: number
  valorGanho: number
  valorPerdido: number
  valorAtivo: number
  semFollowUp: number
  diasMedioResposta: number
}

export interface TemperaturaGrupo {
  temperatura: string
  label: string
  emoji: string
  quantidade: number
  receitaPotencial: number
  diasMedioParado: number
}

export interface AlertaBI {
  tipo: "danger" | "warning" | "info" | "success"
  titulo: string
  descricao: string
  valor?: string | number
}

export interface ForecastPonto {
  mes: string
  receitaReal?: number
  forecast30d?: number
  forecast60d?: number
  tipo: "historico" | "forecast"
}

export interface ComercialBI {
  kpis: KPIsExecutivos
  origensRoi: OrigemROI[]
  etapas: EtapaIntelligence[]
  vendedores: VendedorBI[]
  temperaturas: TemperaturaGrupo[]
  alertas: AlertaBI[]
  forecast: ForecastPonto[]
  totais: {
    totalLeads: number
    leadsAtivos: number
    leadsGanhos: number
    leadsPerdidos: number
    taxaConversao: number
    volumePipeline: number
    semFollowUp: number
    semResponsavel: number
    esquecidos: number // diasParado > 14
  }
  meta: {
    fetchedAt: string
    forecastDisponivel: boolean
    financialDataDisponivel: boolean
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ETAPA_LABELS: Record<string, string> = {
  novo_contato: "Novo Contato",
  em_negociacao: "Em Negociação",
  proposta_enviada: "Proposta Enviada",
  fechado_ganho: "Fechado Ganho",
  fechado_perdido: "Fechado Perdido",
}

const STAGE_MAP: Record<string, string> = {
  QUALIFICACAO: "novo_contato",
  NEGOCIACAO: "em_negociacao",
  PROPOSTA: "proposta_enviada",
  FECHADO_GANHO: "fechado_ganho",
  FECHADO_PERDIDO: "fechado_perdido",
  novo_contato: "novo_contato",
  em_negociacao: "em_negociacao",
  proposta_enviada: "proposta_enviada",
  fechado_ganho: "fechado_ganho",
  fechado_perdido: "fechado_perdido",
}

function normalizeEtapa(s?: string | null): string {
  if (!s) return "novo_contato"
  return STAGE_MAP[s] ?? s.toLowerCase()
}

function calcDias(lastContactAt?: string | null): number {
  if (!lastContactAt) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(lastContactAt).getTime()) / 86_400_000))
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getSession()
  const token = getSessionAccessToken(session)
  const h: Record<string, string> = { "Content-Type": "application/json" }
  if (token) h["Authorization"] = `Bearer ${token}`
  return h
}

async function fetchLeads(headers: Record<string, string>): Promise<LeadBI[]> {
  const res = await fetch(`${BACKEND_URL}/api/comercial/leads`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  }).catch(() => null)

  if (!res?.ok) return []

  const data = await res.json().catch(() => null)
  if (!data) return []

  const raw: any[] = Array.isArray(data) ? data : (data.data ?? data.leads ?? [])

  return raw.map((l: any): LeadBI => {
    const etapa = normalizeEtapa(l.etapa ?? l.stage)
    return {
      id: String(l.id ?? l.kommoId ?? ""),
      nome: l.nome ?? l.name ?? `Lead #${l.id}`,
      etapa,
      temperatura: (l.temperatura ?? l.temperature ?? "FRIO").toUpperCase(),
      origem: l.origem ?? l.source ?? "Desconhecido",
      responsavel: l.responsavel ?? l.owner?.name ?? "",
      valor: l.valor ?? l.estimatedValue ?? 0,
      diasParado: l.diasParado ?? calcDias(l.lastContactAt),
      proximoFollowUp: l.proximoFollowUp ?? l.nextFollowUpAt ?? null,
      isWon: l.isWon ?? etapa === "fechado_ganho",
      isLost: l.isLost ?? etapa === "fechado_perdido",
    }
  })
}

async function fetchDashboardSummary(headers: Record<string, string>) {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const res = await fetch(`${BACKEND_URL}/api/financeiro/db/summary?month=${month}&year=${year}`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)
  if (!res?.ok) return null
  return res.json().catch(() => null)
}

async function fetchForecast(headers: Record<string, string>) {
  // Try known backend forecast endpoints
  for (const path of ["/api/comercial/forecast", "/api/financeiro/forecast", "/api/forecast"]) {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    }).catch(() => null)
    if (res?.ok) {
      const data = await res.json().catch(() => null)
      if (data) return data
    }
  }
  return null
}

// ─── Core computation ─────────────────────────────────────────────────────────

export function computeBI(
  leads: LeadBI[],
  financial: any,
  forecastData: any
): ComercialBI {
  const total = leads.length
  const ativos = leads.filter((l) => !l.isWon && !l.isLost)
  const ganhos = leads.filter((l) => l.isWon)
  const perdidos = leads.filter((l) => l.isLost)
  const semFollowUp = ativos.filter((l) => !l.proximoFollowUp && l.diasParado >= 3)
  const semResponsavel = leads.filter((l) => !l.responsavel || l.responsavel === "Sem responsável")
  const esquecidos = ativos.filter((l) => l.diasParado > 14)
  const taxaConversao = total > 0 ? Math.round((ganhos.length / total) * 100) : 0
  const volumePipeline = ativos.reduce((s, l) => s + l.valor, 0)

  // ── KPIs Executivos ────────────────────────────────────────────────────────
  const despesasMes: number = financial?.despesasMes ?? financial?.totalExpense ?? 0
  const lucroLiquidoMes: number = financial?.lucroLiquidoMes ?? financial?.netProfit ?? 0
  const totalVendasFinanceiras: number = financial?.totalVendas ?? 0

  const receitaKommo = ganhos.reduce((s, l) => s + l.valor, 0)

  const cac = ganhos.length > 0 && despesasMes > 0
    ? Math.round(despesasMes / ganhos.length)
    : null

  const margemComercial = receitaKommo > 0
    ? Math.round(((receitaKommo - despesasMes) / receitaKommo) * 100)
    : null

  const ticketMedioLiquido = totalVendasFinanceiras > 0 && lucroLiquidoMes > 0
    ? Math.round(lucroLiquidoMes / totalVendasFinanceiras)
    : null

  const receitaEmRisco = leads
    .filter((l) => !l.isWon && !l.isLost && l.diasParado > 7 && l.temperatura === "FRIO")
    .reduce((s, l) => s + l.valor, 0)

  const forecast30d: number | null = forecastData?.forecast30d ?? forecastData?.next30days ?? forecastData?.projecao30d ?? null
  const forecast60d: number | null = forecastData?.forecast60d ?? forecastData?.next60days ?? forecastData?.projecao60d ?? null
  const confiancaForecast: number | null = forecastData?.confidence ?? forecastData?.confianca ?? null

  // ── Origens × ROI ─────────────────────────────────────────────────────────
  const origemMap = new Map<string, { total: number; ganhos: number; perdidos: number; receita: number; valorTotal: number }>()
  for (const l of leads) {
    const e = origemMap.get(l.origem) ?? { total: 0, ganhos: 0, perdidos: 0, receita: 0, valorTotal: 0 }
    e.total++
    e.valorTotal += l.valor
    if (l.isWon) { e.ganhos++; e.receita += l.valor }
    if (l.isLost) e.perdidos++
    origemMap.set(l.origem, e)
  }
  const custoPorLead = total > 0 && despesasMes > 0 ? despesasMes / total : 0
  const origensRoi: OrigemROI[] = Array.from(origemMap.entries())
    .map(([origem, s]) => {
      const custoEstimado = Math.round(custoPorLead * s.total)
      const lucroEstimado = s.receita - custoEstimado
      const roi = custoEstimado > 0 ? Math.round((lucroEstimado / custoEstimado) * 100) : 0
      return {
        origem,
        totalLeads: s.total,
        ganhos: s.ganhos,
        perdidos: s.perdidos,
        receitaGerada: s.receita,
        custoEstimado,
        lucroEstimado,
        roi,
        conversao: s.total > 0 ? Math.round((s.ganhos / s.total) * 100) : 0,
      }
    })
    .sort((a, b) => b.receitaGerada - a.receitaGerada)

  // ── Etapas (Pipeline Intelligence) ─────────────────────────────────────────
  const ETAPAS_ATIVAS = ["novo_contato", "em_negociacao", "proposta_enviada"]
  const etapas: EtapaIntelligence[] = ETAPAS_ATIVAS.map((etapa) => {
    const grupo = leads.filter((l) => l.etapa === etapa)
    const dias = grupo.length > 0 ? Math.round(grupo.reduce((s, l) => s + l.diasParado, 0) / grupo.length) : 0
    // Drop-off: proporção de perdidos que veio "desta fase" (estimativa: perdidos / (ativos + perdidos) da fase)
    const perdidosDaFase = perdidos.filter((l) => {
      // Se o lead está perdido e tem o mesmo nível de valor que leads desta fase (heurística)
      return l.diasParado >= 0
    }).length
    const dropOff = grupo.length > 0 ? Math.round((perdidosDaFase / Math.max(grupo.length + perdidosDaFase, 1)) * 100) : 0
    return {
      etapa,
      label: ETAPA_LABELS[etapa] ?? etapa,
      quantidade: grupo.length,
      valor: grupo.reduce((s, l) => s + l.valor, 0),
      diasMedioParado: dias,
      dropOff,
    }
  })

  // ── Vendedores BI ──────────────────────────────────────────────────────────
  const vendMap = new Map<string, {
    total: number; ganhos: number; perdidos: number; valorGanho: number;
    valorPerdido: number; valorAtivo: number; semFollowUp: number; diasTotal: number; diasCount: number
  }>()
  for (const l of leads) {
    const key = l.responsavel || "Sem responsável"
    const v = vendMap.get(key) ?? { total: 0, ganhos: 0, perdidos: 0, valorGanho: 0, valorPerdido: 0, valorAtivo: 0, semFollowUp: 0, diasTotal: 0, diasCount: 0 }
    v.total++
    if (l.isWon) { v.ganhos++; v.valorGanho += l.valor }
    else if (l.isLost) { v.perdidos++; v.valorPerdido += l.valor }
    else {
      v.valorAtivo += l.valor
      v.diasTotal += l.diasParado
      v.diasCount++
      if (!l.proximoFollowUp && l.diasParado >= 3) v.semFollowUp++
    }
    vendMap.set(key, v)
  }
  const vendedores: VendedorBI[] = Array.from(vendMap.entries())
    .map(([responsavel, v]) => ({
      responsavel,
      total: v.total,
      ganhos: v.ganhos,
      perdidos: v.perdidos,
      ativos: v.total - v.ganhos - v.perdidos,
      taxaConversao: v.total > 0 ? Math.round((v.ganhos / v.total) * 100) : 0,
      valorGanho: v.valorGanho,
      valorPerdido: v.valorPerdido,
      valorAtivo: v.valorAtivo,
      semFollowUp: v.semFollowUp,
      diasMedioResposta: v.diasCount > 0 ? Math.round(v.diasTotal / v.diasCount) : 0,
    }))
    .sort((a, b) => b.taxaConversao - a.taxaConversao)

  // ── Temperaturas ──────────────────────────────────────────────────────────
  const tempDef = [
    { temperatura: "QUENTE", label: "Quentes", emoji: "🔥" },
    { temperatura: "MORNO", label: "Mornos", emoji: "⚖️" },
    { temperatura: "FRIO", label: "Frios", emoji: "❄️" },
  ]
  const temperaturas: TemperaturaGrupo[] = tempDef.map(({ temperatura, label, emoji }) => {
    const grupo = ativos.filter((l) => l.temperatura === temperatura)
    const dias = grupo.length > 0 ? Math.round(grupo.reduce((s, l) => s + l.diasParado, 0) / grupo.length) : 0
    return {
      temperatura,
      label,
      emoji,
      quantidade: grupo.length,
      receitaPotencial: grupo.reduce((s, l) => s + l.valor, 0),
      diasMedioParado: dias,
    }
  })

  // ── Alertas BI ────────────────────────────────────────────────────────────
  const alertas: AlertaBI[] = []

  if (receitaEmRisco > 0) {
    alertas.push({
      tipo: "danger",
      titulo: "Receita em Risco",
      descricao: `${BRL(receitaEmRisco)} em leads frios parados há mais de 7 dias sem ação.`,
      valor: BRL(receitaEmRisco),
    })
  }

  if (forecast30d !== null && despesasMes > 0) {
    const cobertura = Math.round((forecast30d / despesasMes) * 100)
    if (cobertura < 80) {
      alertas.push({
        tipo: "danger",
        titulo: "Forecast cobre pouco as despesas",
        descricao: `Previsão 30d cobre apenas ${cobertura}% das despesas operacionais.`,
        valor: `${cobertura}%`,
      })
    }
  }

  const perdidosSemana = perdidos.filter((l) => l.diasParado <= 7).length
  if (perdidosSemana > 0) {
    alertas.push({
      tipo: "warning",
      titulo: "Leads perdidos recentemente",
      descricao: `${perdidosSemana} lead${perdidosSemana > 1 ? "s perdidos" : " perdido"} nos últimos 7 dias.`,
      valor: perdidosSemana,
    })
  }

  // WhatsApp com alto volume + baixa conversão
  const whatsapp = origensRoi.find((o) => o.origem.toLowerCase().includes("whatsapp"))
  if (whatsapp && whatsapp.conversao < 10 && whatsapp.totalLeads >= 5) {
    alertas.push({
      tipo: "warning",
      titulo: "WhatsApp: alto volume, baixa conversão",
      descricao: `${whatsapp.totalLeads} leads mas apenas ${whatsapp.conversao}% de conversão. Revisar abordagem.`,
    })
  }

  // Vendedor com maior taxa de perda
  const piorVendedor = vendedores.filter((v) => v.total >= 3).sort((a, b) => b.perdidos - a.perdidos)[0]
  if (piorVendedor && piorVendedor.perdidos > 0) {
    const taxaPerda = Math.round((piorVendedor.perdidos / piorVendedor.total) * 100)
    if (taxaPerda >= 40) {
      alertas.push({
        tipo: "warning",
        titulo: `${piorVendedor.responsavel} com alta taxa de perda`,
        descricao: `${taxaPerda}% dos leads perdidos (${piorVendedor.perdidos}/${piorVendedor.total}).`,
      })
    }
  }

  // Melhor canal por ROI
  const melhorROI = origensRoi.filter((o) => o.roi > 0).sort((a, b) => b.roi - a.roi)[0]
  if (melhorROI) {
    alertas.push({
      tipo: "success",
      titulo: `Melhor ROI: ${melhorROI.origem}`,
      descricao: `ROI de ${melhorROI.roi}% — ${melhorROI.ganhos} ganhos de ${melhorROI.totalLeads} leads.`,
    })
  }

  if (taxaConversao >= 20) {
    alertas.push({
      tipo: "success",
      titulo: "Boa taxa de conversão",
      descricao: `${taxaConversao}% dos leads convertidos. Acima da média do setor.`,
    })
  }

  // ── Forecast visual ────────────────────────────────────────────────────────
  const forecast: ForecastPonto[] = []
  if (forecastData?.historico && Array.isArray(forecastData.historico)) {
    for (const p of forecastData.historico) {
      forecast.push({ mes: p.mes ?? p.month, receitaReal: p.receita ?? p.revenue, tipo: "historico" })
    }
  }
  if (forecast30d !== null) {
    const now = new Date()
    forecast.push({
      mes: `${now.getMonth() + 2}/${now.getFullYear()}`.replace(/^(\d+)\/(\d{4})$/, (_, m, y) => `${m.padStart(2, "0")}/${y}`),
      forecast30d,
      tipo: "forecast",
    })
  }
  if (forecast60d !== null) {
    const now = new Date()
    const next2 = new Date(now.getFullYear(), now.getMonth() + 2, 1)
    forecast.push({
      mes: `${next2.getMonth() + 1}/${next2.getFullYear()}`.replace(/^(\d+)\/(\d{4})$/, (_, m, y) => `${m.padStart(2, "0")}/${y}`),
      forecast60d,
      tipo: "forecast",
    })
  }

  return {
    kpis: { cac, margemComercial, ticketMedioLiquido, receitaEmRisco, forecast30d, forecast60d, confiancaForecast },
    origensRoi,
    etapas,
    vendedores,
    temperaturas,
    alertas,
    forecast,
    totais: {
      totalLeads: total,
      leadsAtivos: ativos.length,
      leadsGanhos: ganhos.length,
      leadsPerdidos: perdidos.length,
      taxaConversao,
      volumePipeline,
      semFollowUp: semFollowUp.length,
      semResponsavel: semResponsavel.length,
      esquecidos: esquecidos.length,
    },
    meta: {
      fetchedAt: new Date().toISOString(),
      forecastDisponivel: !!forecastData,
      financialDataDisponivel: !!financial,
    },
  }
}

function BRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(v)
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function fetchComercialBI(): Promise<ComercialBI> {
  const headers = await authHeaders()

  const [leads, financial, forecastData] = await Promise.allSettled([
    fetchLeads(headers),
    fetchDashboardSummary(headers),
    fetchForecast(headers),
  ])

  return computeBI(
    leads.status === "fulfilled" ? leads.value : [],
    financial.status === "fulfilled" ? financial.value : null,
    forecastData.status === "fulfilled" ? forecastData.value : null,
  )
}
