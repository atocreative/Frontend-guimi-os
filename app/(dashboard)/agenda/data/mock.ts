export type StatusTarefa = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA"
export type PrioridadeTarefa = "ALTA" | "MEDIA" | "BAIXA"
export type TipoTarefa = "TAREFA" | "RECORRENTE" | "COMPROMISSO"

export interface Tarefa {
  id: string
  titulo: string
  descricao?: string
  tipo: TipoTarefa
  status: StatusTarefa
  prioridade: PrioridadeTarefa
  responsavel: string
  avatar: string
  prazo: string
  horario?: string
  recorrente: boolean
  concluida: boolean
  tags?: string[]
}

export const mockUsuarios = [
  { id: "1", nome: "Gui", avatar: "G", role: "ADMIN" },
  { id: "2", nome: "Ana", avatar: "A", role: "COLABORADOR" },
  { id: "3", nome: "Pedro", avatar: "P", role: "COLABORADOR" },
]

export const mockTarefasTime: Tarefa[] = [
  // GUI
  {
    id: "1",
    titulo: "Responder proposta cliente VIP",
    descricao: "João Silva aguarda retorno sobre iPhone 15 Pro",
    tipo: "TAREFA",
    status: "PENDENTE",
    prioridade: "ALTA",
    responsavel: "Gui",
    avatar: "G",
    prazo: "Hoje",
    recorrente: false,
    concluida: false,
    tags: ["comercial"],
  },
  {
    id: "2",
    titulo: "Revisar fechamento financeiro de março",
    tipo: "TAREFA",
    status: "EM_ANDAMENTO",
    prioridade: "ALTA",
    responsavel: "Gui",
    avatar: "G",
    prazo: "Hoje",
    recorrente: false,
    concluida: false,
    tags: ["financeiro"],
  },
  {
    id: "3",
    titulo: "Abertura da loja",
    descricao: "Checklist diário de abertura",
    tipo: "RECORRENTE",
    status: "CONCLUIDA",
    prioridade: "ALTA",
    responsavel: "Gui",
    avatar: "G",
    prazo: "Hoje",
    horario: "09:00",
    recorrente: true,
    concluida: true,
    tags: ["operacao"],
  },
  {
    id: "4",
    titulo: "Reunião com fornecedor Apple",
    tipo: "COMPROMISSO",
    status: "PENDENTE",
    prioridade: "MEDIA",
    responsavel: "Gui",
    avatar: "G",
    prazo: "Hoje",
    horario: "14:00",
    recorrente: false,
    concluida: false,
    tags: ["externo"],
  },
  {
    id: "5",
    titulo: "Publicar conteúdo no Instagram",
    tipo: "RECORRENTE",
    status: "PENDENTE",
    prioridade: "MEDIA",
    responsavel: "Gui",
    avatar: "G",
    prazo: "Hoje",
    recorrente: true,
    concluida: false,
    tags: ["marketing"],
  },
  // ANA
  {
    id: "6",
    titulo: "Atender leads do Instagram",
    descricao: "Responder todas as mensagens em aberto",
    tipo: "RECORRENTE",
    status: "EM_ANDAMENTO",
    prioridade: "ALTA",
    responsavel: "Ana",
    avatar: "A",
    prazo: "Hoje",
    recorrente: true,
    concluida: false,
    tags: ["comercial"],
  },
  {
    id: "7",
    titulo: "Avaliação trade-in — cliente novo",
    descricao: "Cliente traz iPhone 13 para avaliação às 16:30",
    tipo: "COMPROMISSO",
    status: "PENDENTE",
    prioridade: "ALTA",
    responsavel: "Ana",
    avatar: "A",
    prazo: "Hoje",
    horario: "16:30",
    recorrente: false,
    concluida: false,
    tags: ["operacao"],
  },
  {
    id: "8",
    titulo: "Organizar estoque de seminovos",
    tipo: "TAREFA",
    status: "PENDENTE",
    prioridade: "MEDIA",
    responsavel: "Ana",
    avatar: "A",
    prazo: "Hoje",
    recorrente: false,
    concluida: false,
    tags: ["operacao"],
  },
  {
    id: "9",
    titulo: "Atualizar planilha de entrada de aparelhos",
    tipo: "RECORRENTE",
    status: "CONCLUIDA",
    prioridade: "MEDIA",
    responsavel: "Ana",
    avatar: "A",
    prazo: "Hoje",
    recorrente: true,
    concluida: true,
    tags: ["operacao"],
  },
  // PEDRO
  {
    id: "10",
    titulo: "Follow-up clientes em negociação",
    descricao: "Ligar para leads com proposta enviada há mais de 2 dias",
    tipo: "RECORRENTE",
    status: "PENDENTE",
    prioridade: "ALTA",
    responsavel: "Pedro",
    avatar: "P",
    prazo: "Hoje",
    recorrente: true,
    concluida: false,
    tags: ["comercial"],
  },
  {
    id: "11",
    titulo: "Entrega iPhone 15 Pro — João Silva",
    tipo: "COMPROMISSO",
    status: "PENDENTE",
    prioridade: "ALTA",
    responsavel: "Pedro",
    avatar: "P",
    prazo: "Hoje",
    horario: "10:00",
    recorrente: false,
    concluida: false,
    tags: ["comercial"],
  },
  {
    id: "12",
    titulo: "Fotografar aparelhos para anúncio",
    tipo: "TAREFA",
    status: "PENDENTE",
    prioridade: "BAIXA",
    responsavel: "Pedro",
    avatar: "P",
    prazo: "Amanhã",
    recorrente: false,
    concluida: false,
    tags: ["marketing"],
  },
]

export const mockResumoTime = {
  totalHoje: 12,
  concluidas: 2,
  emAndamento: 2,
  pendentes: 8,
  atrasadas: 0,
  porPessoa: [
    { nome: "Gui", avatar: "G", total: 5, concluidas: 1 },
    { nome: "Ana", avatar: "A", total: 4, concluidas: 1 },
    { nome: "Pedro", avatar: "P", total: 3, concluidas: 0 },
  ],
}
