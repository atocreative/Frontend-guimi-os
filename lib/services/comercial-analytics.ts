import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

export interface LeadRaw {
  id: string
  kommoId?: string | number
  nome?: string
  name?: string
  telefone?: string
  phone?: string
  etapa?: string
  stage?: string
  valor?: number
  estimatedValue?: number
  temperatura?: string
  temperature?: string
  origem?: string
  source?: string
  responsavel?: string
  owner?: { name?: string }
  ultimoContato?: string
  lastContactAt?: string
  proximoFollowUp?: string
  nextFollowUpAt?: string
  diasParado?: number
  produto?: string
  status?: string
}

export interface OrigemLead {
  origem: string
  quantidade: number
  percentual: number
  valor: number
}

export interface PipelineEtapa {
  etapa: string
  label: string
  quantidade: number
  valor: number
  percentual: number
}

export interface VendedorStats {
  responsavel: string
  total: number
  ganhos: number
  perdidos: number
  ativos: number
  taxaConversao: number
  valorTotal: number
  semFollowUp: number
}

export interface AlertaComercial {
  tipo: "danger" | "warning" | "info"
  titulo: string
  descricao: string
  valor?: number | string
}

export interface ComercialAnalytics {
  origens: OrigemLead[]
  pipeline: PipelineEtapa[]
  vendedores: VendedorStats[]
  alertas: AlertaComercial[]
  totais: {
    totalLeads: number
    leadsAtivos: number
    leadsGanhos: number
    leadsPerdidos: number
    taxaConversao: number
    volumePipeline: number
    ticketMedio: number
    semFollowUp: number
    diasMedioParado: number
  }
}

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

function normalizeEtapa(stage?: string | null): string {
  if (!stage) return "novo_contato"
  return STAGE_MAP[stage] ?? stage.toLowerCase()
}

function calcDiasParado(lastContactAt?: string | null): number {
  if (!lastContactAt) return 0
  const diff = Date.now() - new Date(lastContactAt).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export async function fetchComercialLeadsRaw(): Promise<LeadRaw[]> {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BACKEND_URL}/api/comercial/leads`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  }).catch(() => null)

  if (!res?.ok) return []

  const data = await res.json().catch(() => null)
  if (!data) return []

  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.leads)) return data.leads
  return []
}

export function computeAnalytics(raw: LeadRaw[]): ComercialAnalytics {
  const leads = raw.map((l) => ({
    id: String(l.id),
    nome: l.nome ?? l.name ?? `Lead #${l.kommoId ?? l.id}`,
    etapa: normalizeEtapa(l.etapa ?? l.stage),
    valor: l.valor ?? l.estimatedValue ?? 0,
    origem: l.origem ?? l.source ?? "Desconhecido",
    responsavel: l.responsavel ?? l.owner?.name ?? "Sem responsável",
    diasParado: l.diasParado ?? calcDiasParado(l.lastContactAt),
    proximoFollowUp: l.proximoFollowUp ?? l.nextFollowUpAt ?? null,
  }))

  const total = leads.length
  const ganhos = leads.filter((l) => l.etapa === "fechado_ganho")
  const perdidos = leads.filter((l) => l.etapa === "fechado_perdido")
  const ativos = leads.filter((l) => l.etapa !== "fechado_ganho" && l.etapa !== "fechado_perdido")
  const semFollowUp = ativos.filter((l) => !l.proximoFollowUp && l.diasParado >= 3)
  const volumePipeline = ativos.reduce((s, l) => s + l.valor, 0)
  const taxaConversao = total > 0 ? Math.round((ganhos.length / total) * 100) : 0
  const ticketMedio = ganhos.length > 0 ? Math.round(ganhos.reduce((s, l) => s + l.valor, 0) / ganhos.length) : 0
  const diasMedioParado = ativos.length > 0 ? Math.round(ativos.reduce((s, l) => s + l.diasParado, 0) / ativos.length) : 0

  // Origens
  const origemMap = new Map<string, { quantidade: number; valor: number }>()
  for (const l of leads) {
    const e = origemMap.get(l.origem) ?? { quantidade: 0, valor: 0 }
    e.quantidade++
    e.valor += l.valor
    origemMap.set(l.origem, e)
  }
  const origens: OrigemLead[] = Array.from(origemMap.entries())
    .map(([origem, { quantidade, valor }]) => ({
      origem,
      quantidade,
      valor,
      percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade)

  // Pipeline
  const etapas = ["novo_contato", "em_negociacao", "proposta_enviada", "fechado_ganho", "fechado_perdido"]
  const pipeline: PipelineEtapa[] = etapas.map((etapa) => {
    const etapaLeads = leads.filter((l) => l.etapa === etapa)
    return {
      etapa,
      label: ETAPA_LABELS[etapa] ?? etapa,
      quantidade: etapaLeads.length,
      valor: etapaLeads.reduce((s, l) => s + l.valor, 0),
      percentual: total > 0 ? Math.round((etapaLeads.length / total) * 100) : 0,
    }
  })

  // Vendedores
  const vendMap = new Map<string, { total: number; ganhos: number; perdidos: number; valorTotal: number; semFollowUp: number }>()
  for (const l of leads) {
    const v = vendMap.get(l.responsavel) ?? { total: 0, ganhos: 0, perdidos: 0, valorTotal: 0, semFollowUp: 0 }
    v.total++
    if (l.etapa === "fechado_ganho") v.ganhos++
    if (l.etapa === "fechado_perdido") v.perdidos++
    v.valorTotal += l.valor
    if (!l.proximoFollowUp && l.diasParado >= 3 && l.etapa !== "fechado_ganho" && l.etapa !== "fechado_perdido") v.semFollowUp++
    vendMap.set(l.responsavel, v)
  }
  const vendedores: VendedorStats[] = Array.from(vendMap.entries())
    .map(([responsavel, s]) => ({
      responsavel,
      total: s.total,
      ganhos: s.ganhos,
      perdidos: s.perdidos,
      ativos: s.total - s.ganhos - s.perdidos,
      taxaConversao: s.total > 0 ? Math.round((s.ganhos / s.total) * 100) : 0,
      valorTotal: s.valorTotal,
      semFollowUp: s.semFollowUp,
    }))
    .sort((a, b) => b.taxaConversao - a.taxaConversao)

  // Alertas
  const alertas: AlertaComercial[] = []

  if (semFollowUp.length >= 5) {
    alertas.push({
      tipo: "danger",
      titulo: "Leads sem follow-up",
      descricao: `${semFollowUp.length} leads ativos há mais de 3 dias sem próximo contato agendado.`,
      valor: semFollowUp.length,
    })
  } else if (semFollowUp.length > 0) {
    alertas.push({
      tipo: "warning",
      titulo: "Follow-ups pendentes",
      descricao: `${semFollowUp.length} leads precisam de follow-up.`,
      valor: semFollowUp.length,
    })
  }

  if (perdidos.length > 0 && total > 0) {
    const pctPerdidos = Math.round((perdidos.length / total) * 100)
    if (pctPerdidos >= 40) {
      alertas.push({
        tipo: "danger",
        titulo: "Alta taxa de leads perdidos",
        descricao: `${pctPerdidos}% dos leads foram perdidos (${perdidos.length} de ${total}).`,
        valor: `${pctPerdidos}%`,
      })
    }
  }

  if (diasMedioParado >= 7) {
    alertas.push({
      tipo: "warning",
      titulo: "Pipeline parado",
      descricao: `Leads ativos estão parados em média há ${diasMedioParado} dias sem atualização.`,
      valor: `${diasMedioParado} dias`,
    })
  }

  const vendSemFollowUp = vendedores.filter((v) => v.semFollowUp >= 3)
  for (const v of vendSemFollowUp.slice(0, 2)) {
    alertas.push({
      tipo: "warning",
      titulo: `${v.responsavel} sem follow-up`,
      descricao: `${v.semFollowUp} leads sem próximo contato agendado.`,
    })
  }

  if (origens.length > 0) {
    const melhor = origens[0]
    alertas.push({
      tipo: "info",
      titulo: `Melhor origem: ${melhor.origem}`,
      descricao: `${melhor.quantidade} leads (${melhor.percentual}% do total). Maior volume de entrada.`,
    })
  }

  if (taxaConversao >= 20) {
    alertas.push({
      tipo: "info",
      titulo: "Boa taxa de conversão",
      descricao: `${taxaConversao}% dos leads foram convertidos em vendas.`,
      valor: `${taxaConversao}%`,
    })
  }

  return {
    origens,
    pipeline,
    vendedores,
    alertas,
    totais: {
      totalLeads: total,
      leadsAtivos: ativos.length,
      leadsGanhos: ganhos.length,
      leadsPerdidos: perdidos.length,
      taxaConversao,
      volumePipeline,
      ticketMedio,
      semFollowUp: semFollowUp.length,
      diasMedioParado,
    },
  }
}
