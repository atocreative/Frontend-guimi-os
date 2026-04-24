export type Temperatura = "QUENTE" | "MORNO" | "FRIO"
export type EtapaPipeline =
  | "novo_contato"
  | "em_negociacao"
  | "proposta_enviada"
  | "fechado_ganho"
  | "fechado_perdido"

export interface Lead {
  id: string
  nome: string
  telefone: string
  produto: string
  valor: number
  etapa: EtapaPipeline
  temperatura: Temperatura
  origem: string
  responsavel: string
  ultimoContato: string
  proximoFollowUp: string | null
  diasParado: number
  kommoId?: string
}

export const mockLeads: Lead[] = [
  {
    id: "1",
    nome: "João Silva",
    telefone: "(61) 99999-1111",
    produto: "iPhone 15 Pro 256GB",
    valor: 8500,
    etapa: "proposta_enviada",
    temperatura: "QUENTE",
    origem: "Instagram",
    responsavel: "Gui",
    ultimoContato: "Hoje",
    proximoFollowUp: "Amanhã",
    diasParado: 0,
  },
  {
    id: "2",
    nome: "Maria Oliveira",
    telefone: "(61) 99999-2222",
    produto: "iPhone 14 128GB",
    valor: 4800,
    etapa: "em_negociacao",
    temperatura: "MORNO",
    origem: "Indicação",
    responsavel: "Gui",
    ultimoContato: "Ontem",
    proximoFollowUp: "Hoje",
    diasParado: 1,
  },
  {
    id: "3",
    nome: "Carlos Mendes",
    telefone: "(61) 99999-3333",
    produto: "iPhone 15 128GB",
    valor: 6200,
    etapa: "novo_contato",
    temperatura: "MORNO",
    origem: "WhatsApp",
    responsavel: "Gui",
    ultimoContato: "3 dias atrás",
    proximoFollowUp: null,
    diasParado: 3,
  },
  {
    id: "4",
    nome: "Ana Costa",
    telefone: "(61) 99999-4444",
    produto: "iPhone 13 256GB",
    valor: 3900,
    etapa: "fechado_ganho",
    temperatura: "QUENTE",
    origem: "Instagram",
    responsavel: "Gui",
    ultimoContato: "Hoje",
    proximoFollowUp: null,
    diasParado: 0,
  },
  {
    id: "5",
    nome: "Roberto Lima",
    telefone: "(61) 99999-5555",
    produto: "iPhone 15 Pro Max 512GB",
    valor: 11200,
    etapa: "em_negociacao",
    temperatura: "QUENTE",
    origem: "Indicação",
    responsavel: "Gui",
    ultimoContato: "Hoje",
    proximoFollowUp: "Amanhã",
    diasParado: 0,
  },
  {
    id: "6",
    nome: "Fernanda Souza",
    telefone: "(61) 99999-6666",
    produto: "iPhone 14 Pro 256GB",
    valor: 5900,
    etapa: "novo_contato",
    temperatura: "FRIO",
    origem: "Google",
    responsavel: "Gui",
    ultimoContato: "5 dias atrás",
    proximoFollowUp: null,
    diasParado: 5,
  },
  {
    id: "7",
    nome: "Lucas Ferreira",
    telefone: "(61) 99999-7777",
    produto: "iPhone 15 256GB",
    valor: 7100,
    etapa: "proposta_enviada",
    temperatura: "MORNO",
    origem: "WhatsApp",
    responsavel: "Gui",
    ultimoContato: "2 dias atrás",
    proximoFollowUp: "Hoje",
    diasParado: 2,
  },
  {
    id: "8",
    nome: "Patrícia Nunes",
    telefone: "(61) 99999-8888",
    produto: "iPhone 13 128GB",
    valor: 3200,
    etapa: "fechado_perdido",
    temperatura: "FRIO",
    origem: "Instagram",
    responsavel: "Gui",
    ultimoContato: "1 semana atrás",
    proximoFollowUp: null,
    diasParado: 7,
  },
  {
    id: "9",
    nome: "Marcos Alves",
    telefone: "(61) 99999-9999",
    produto: "iPhone 15 Pro 512GB",
    valor: 9800,
    etapa: "novo_contato",
    temperatura: "QUENTE",
    origem: "Indicação",
    responsavel: "Gui",
    ultimoContato: "Hoje",
    proximoFollowUp: "Amanhã",
    diasParado: 0,
  },
  {
    id: "10",
    nome: "Juliana Castro",
    telefone: "(61) 99999-0000",
    produto: "iPhone 14 256GB",
    valor: 5100,
    etapa: "em_negociacao",
    temperatura: "FRIO",
    origem: "WhatsApp",
    responsavel: "Gui",
    ultimoContato: "4 dias atrás",
    proximoFollowUp: null,
    diasParado: 4,
  },
]

export const etapas = [
  { key: "novo_contato", label: "Novo Contato", cor: "bg-blue-500" },
  { key: "em_negociacao", label: "Em Negociação", cor: "bg-amber-500" },
  { key: "proposta_enviada", label: "Proposta Enviada", cor: "bg-purple-500" },
  { key: "fechado_ganho", label: "Fechado Ganho", cor: "bg-emerald-500" },
  { key: "fechado_perdido", label: "Fechado Perdido", cor: "bg-red-500" },
]

export const mockMetricas = {
  totalLeads: 10,
  leadsAtivos: 8,
  leadsSemFollowUp: 3,
  taxaConversao: 31,
  ticketMedio: 6570,
  volumePipeline: 58600,
  leadsPorEtapa: {
    novo_contato: 3,
    em_negociacao: 3,
    proposta_enviada: 2,
    fechado_ganho: 1,
    fechado_perdido: 1,
  },
}
