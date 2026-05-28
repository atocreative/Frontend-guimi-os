import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getSessionAccessToken } from "@/lib/backend-api"
import type { NextRequest } from "next/server"
import type { ComercialBI, KPIs, Pipeline, ScorePenalty, LeadPrioritario, FonteLead } from "@/lib/services/comercial-bi"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001"
).replace(/\/$/, "")

async function backendFetch(path: string, headers: Record<string, string>, params: URLSearchParams): Promise<any> {
  const url = new URL(`${BACKEND_URL}${path}`)
  params.forEach((v, k) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)
  if (!res?.ok) return null
  return res.json().catch(() => null)
}

function extractArray(data: any, ...keys: string[]): any[] {
  if (Array.isArray(data)) return data
  for (const k of keys) {
    if (Array.isArray(data?.[k])) return data[k]
  }
  return []
}

/** Pega o primeiro valor numérico válido entre múltiplos caminhos possíveis.
 *  Retorna null se nenhum existir (não converte ausência em 0). */
function pickNum(...vals: unknown[]): number | null {
  for (const v of vals) {
    if (v === undefined || v === null) continue
    const n = typeof v === "number" ? v : Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  const token = getSessionAccessToken(session)

  const authHeaders: Record<string, string> = { "Content-Type": "application/json" }
  if (token) authHeaders["Authorization"] = `Bearer ${token}`

  const params = new URLSearchParams()
  req.nextUrl.searchParams.forEach((v, k) => params.set(k, v))

  const [op, pipelineRaw, priorityRaw, sourcesRaw] = await Promise.all([
    backendFetch("/api/comercial/operational",          authHeaders, params),
    backendFetch("/api/comercial/pipeline-operational", authHeaders, params),
    backendFetch("/api/comercial/priority-leads",       authHeaders, params),
    backendFetch("/api/comercial/lead-sources",         authHeaders, params),
  ])

  if (!op) {
    return NextResponse.json({ error: "OPERATIONAL_UNAVAILABLE" }, { status: 503 })
  }

  // Backend pode retornar { kpis: {...}, alertas: [...] } OU campos flat top-level.
  const k: any = op.kpis ?? op
  const f: any = op // sempre disponível como fallback raiz

  const kpis: KPIs = {
    leadsAtivos:        pickNum(k.leadsAtivos, k.activeLeads, k.openLeads, k.leadsAbertos, f.leadsAtivos, f.activeLeads),
    leadsGanhos:        pickNum(k.leadsGanhos, k.wonLeads, k.leadsFechadosGanhos, k.ganhos, f.leadsGanhos, f.wonLeads),
    leadsPerdidos:      pickNum(k.leadsPerdidos, k.lostLeads, k.leadsFechadosPerdidos, k.perdidos, f.leadsPerdidos, f.lostLeads),
    tempoRespostaMedio: pickNum(
      k.tempoRespostaMedio, k.avgResponseTime, k.averageResponseTime, k.responseTimeAvgMin,
      k.responseTimeMinutes, k.tempoMedioResposta, k.tempoMedio, k.firstResponseMin,
      f.tempoRespostaMedio, f.avgResponseTime,
    ),
    chatsSemResposta:   pickNum(
      k.chatsSemResposta, k.unansweredChats, k.openChats, k.chatsAguardando, k.semResposta,
      f.chatsSemResposta, f.unansweredChats,
    ),
    conversasAtuais:    pickNum(
      k.conversasAtuais, k.totalConversas, k.totalConversations, k.activeConversations,
      k.openConversations, k.conversations, k.chats, k.totalChats, k.activeChats,
      f.conversasAtuais, f.totalConversations, f.chats,
    ),
    taxaConversao:      pickNum(k.taxaConversao, k.conversionRate, k.conversaoTaxa, f.taxaConversao, f.conversionRate),
    semResponsavel:     pickNum(k.leadsSemResponsavel, k.semResponsavel, k.withoutOwner, f.semResponsavel),
    esquecidos:         pickNum(k.leadsEsquecidos, k.esquecidos, k.forgottenLeads, f.esquecidos),
    leadsSemTarefa:     pickNum(k.leadsSemTarefa, k.withoutTask, f.leadsSemTarefa),
    tarefasPendentes:   pickNum(k.tarefasPendentes, k.pendingTasks, f.tarefasPendentes),
    tarefasConcluidas:  pickNum(k.tarefasConcluidas, k.completedTasks, f.tarefasConcluidas),
  }

  // ── pipeline.stages — from pipeline-operational ────────────────────────────
  const rawStages = extractArray(pipelineRaw, "stages", "etapas", "pipeline", "data")
  const CLOSED = new Set(["fechado_ganho", "fechado_perdido", "won", "lost"])
  const stages = rawStages
    .filter((s: any) => !CLOSED.has((s.stage ?? s.etapa ?? "").toLowerCase()))
    .map((s: any) => ({
      stage:        String(s.stage   ?? s.etapa ?? ""),
      label:        String(s.label   ?? s.stage ?? s.etapa ?? ""),
      leads:        Number(s.leads   ?? s.quantidade ?? s.count ?? 0),
      avgDiasEtapa: Number(s.avgDiasEtapa ?? s.diasMedioParado ?? s.aging ?? 0),
    }))

  const pipeline: Pipeline = { stages }

  // ── leadsPrioritarios — from priority-leads ────────────────────────────────
  const rawLeads = extractArray(priorityRaw, "leads", "data", "items")
  const leadsPrioritarios: LeadPrioritario[] = rawLeads
    .filter((l: any) => !CLOSED.has((l.stage ?? l.etapa ?? "").toLowerCase()))
    .map((l: any) => {
      let owner: string | null = null
      if (typeof l.owner === "string" && l.owner.length > 0) owner = l.owner
      else if (l.owner?.name) owner = l.owner.name
      else if (l.responsavel && l.responsavel !== "Sem responsável") owner = l.responsavel

      return {
        id:              String(l.id ?? l.kommoId ?? ""),
        nome:            String(l.nome ?? l.name ?? `Lead #${l.id}`),
        etapa:           String(l.stage ?? l.etapa ?? "novo_contato"),
        owner,
        diasParado:      Number(l.diasParado ?? l.daysIdle ?? l.daysSinceLastActivity ?? 0),
        proximoFollowUp: l.proximoFollowUp ?? l.nextFollowUp ?? null,
      }
    })

  // ── fontesLead — from lead-sources ────────────────────────────────────────
  const rawSources = extractArray(sourcesRaw, "data", "sources", "origens")
  const fontesLead: FonteLead[] = rawSources
    .filter((s: any) => (s.quantidade ?? s.total ?? s.count ?? 0) > 0)
    .map((s: any) => ({
      origem:     String(s.origem ?? s.source ?? s.name ?? "Desconhecida"),
      quantidade: Number(s.quantidade ?? s.total ?? s.count ?? 0),
      ganhos:     Number(s.ganhos ?? s.won ?? s.converted ?? 0),
    }))

  // ── score.penalties — from op.alertas ─────────────────────────────────────
  const rawAlertas = extractArray(op.alertas ?? op.kpis?.alertas)
  const penalties: ScorePenalty[] = rawAlertas
    .filter((a: any) => a?.titulo && a?.descricao)
    .map((a: any) => ({
      tipo:       (["danger", "warning", "info", "success"].includes(a.tipo) ? a.tipo : "info") as ScorePenalty["tipo"],
      titulo:     String(a.titulo),
      descricao:  String(a.descricao),
      prioridade: [1, 2, 3].includes(a.prioridade) ? a.prioridade : 3,
    }))
    .sort((a: ScorePenalty, b: ScorePenalty) => (a.prioridade ?? 3) - (b.prioridade ?? 3))

  const body: ComercialBI = {
    kpis,
    pipeline,
    leadsPrioritarios,
    fontesLead,
    score: { penalties },
  }

  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } })
}
