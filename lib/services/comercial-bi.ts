// ─── Contract types — shape produced by /api/comercial/bi BFF ────────────────
// Campos podem ser null quando backend não fornece — frontend exibe "N/D".

export interface KPIs {
  leadsAtivos: number | null
  leadsGanhos: number | null
  leadsPerdidos: number | null
  tempoRespostaMedio: number | null
  chatsSemResposta: number | null
  conversasAtuais: number | null
  leadsSemTarefa?: number | null
  tarefasPendentes?: number | null
  tarefasConcluidas?: number | null
  taxaConversao?: number | null
  semResponsavel?: number | null
  esquecidos?: number | null
}

export interface PipelineStage {
  stage: string
  label: string
  leads: number
  avgDiasEtapa: number
}

export interface Pipeline {
  stages: PipelineStage[]
}

export interface LeadPrioritario {
  id: string
  nome: string
  etapa: string
  owner: string | null
  diasParado: number
  proximoFollowUp: string | null
}

export interface FonteLead {
  origem: string
  quantidade: number
  ganhos: number
}

export interface ScorePenalty {
  tipo: "danger" | "warning" | "info" | "success"
  titulo: string
  descricao: string
  prioridade?: number
}

export interface Score {
  penalties: ScorePenalty[]
}

export interface ComercialBI {
  kpis: KPIs
  pipeline: Pipeline
  leadsPrioritarios: LeadPrioritario[]
  fontesLead: FonteLead[]
  score: Score
}
