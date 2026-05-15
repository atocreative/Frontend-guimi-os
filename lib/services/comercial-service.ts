import { getSessionAccessToken } from '@/lib/backend-api'
import { getSession } from '@/lib/auth-session'

const STAGE_MAP: Record<string, string> = {
  QUALIFICACAO: "novo_contato",
  NEGOCIACAO: "em_negociacao",
  PROPOSTA: "proposta_enviada",
  FECHADO_GANHO: "fechado_ganho",
  FECHADO_PERDIDO: "fechado_perdido",
  // Kommo native
  novo_contato: "novo_contato",
  em_negociacao: "em_negociacao",
  proposta_enviada: "proposta_enviada",
  fechado_ganho: "fechado_ganho",
  fechado_perdido: "fechado_perdido",
}

function normalizeStage(stage: string | null | undefined): string {
  if (!stage) return "novo_contato"
  return STAGE_MAP[stage] ?? stage.toLowerCase()
}

function calcDiasParado(lastContactAt: string | null | undefined): number {
  if (!lastContactAt) return 0
  const diff = Date.now() - new Date(lastContactAt).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001'
).replace(/\/$/, '')

export async function getComercialLeads(): Promise<any[] | null> {
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${BACKEND_URL}/api/comercial/leads`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      console.warn('[COMERCIAL LEADS] API error:', res.status)
      return null
    }

    const data = await res.json().catch(() => null)

    let raw: any[] | null = null
    if (Array.isArray(data)) raw = data
    else if (data?.data && Array.isArray(data.data)) raw = data.data
    else if (data?.leads && Array.isArray(data.leads)) raw = data.leads

    if (!raw) return null

    // Map backend field names to what the page expects
    return raw.map((lead: any) => ({
      ...lead,
      nome: lead.nome ?? lead.name ?? `Lead #${lead.kommoId ?? lead.id}`,
      telefone: lead.telefone ?? lead.phone ?? null,
      etapa: lead.etapa ?? normalizeStage(lead.stage),
      valor: lead.valor ?? lead.estimatedValue ?? 0,
      temperatura: lead.temperatura ?? lead.temperature ?? "FRIO",
      origem: lead.origem ?? lead.source ?? "Kommo",
      responsavel: lead.responsavel ?? lead.owner?.name ?? null,
      ultimoContato: lead.ultimoContato ?? (lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString("pt-BR") : "—"),
      proximoFollowUp: lead.proximoFollowUp ?? lead.nextFollowUpAt ?? null,
      diasParado: lead.diasParado ?? calcDiasParado(lead.lastContactAt),
    }))
  } catch (error) {
    console.warn('[COMERCIAL LEADS] Fetch error:', error)
    return null
  }
}
