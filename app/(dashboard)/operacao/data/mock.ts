export type StatusAparelho =
  | "DISPONIVEL"
  | "RESERVADO"
  | "AGUARDANDO_RETIRADA"
  | "EM_AVALIACAO"
  | "AVALIADO"

export type TipoAparelho = "NOVO" | "SEMINOVO" | "TRADE_IN"

export interface Aparelho {
  id: string
  modelo: string
  capacidade: string
  cor: string
  tipo: TipoAparelho
  status: StatusAparelho
  preco: number
  custo?: number
  imei?: string
  cliente?: string
  dataEntrada: string
  observacao?: string
  foneNinjaId?: string | null
}

export interface ItemChecklist {
  id: string
  titulo: string
  descricao?: string
  concluido: boolean
  responsavel: string
  horario?: string
}

export const mockChecklistAbertura: ItemChecklist[] = [
  {
    id: "a1",
    titulo: "Ligar sistemas e computadores",
    concluido: true,
    responsavel: "Gui",
    horario: "09:00",
  },
  {
    id: "a2",
    titulo: "Verificar e-mails e mensagens do WhatsApp",
    concluido: true,
    responsavel: "Gui",
    horario: "09:05",
  },
  {
    id: "a3",
    titulo: "Conferir estoque físico com o sistema",
    concluido: false,
    responsavel: "Ana",
    horario: "09:15",
  },
  {
    id: "a4",
    titulo: "Organizar vitrine e expositores",
    concluido: false,
    responsavel: "Ana",
    horario: "09:20",
  },
  {
    id: "a5",
    titulo: "Verificar aparelhos aguardando retirada",
    concluido: false,
    responsavel: "Pedro",
    horario: "09:15",
  },
  {
    id: "a6",
    titulo: "Checar leads em aberto do dia anterior",
    concluido: true,
    responsavel: "Pedro",
    horario: "09:30",
  },
]

export const mockChecklistFechamento: ItemChecklist[] = [
  {
    id: "f1",
    titulo: "Registrar todas as vendas do dia no sistema",
    concluido: false,
    responsavel: "Gui",
    horario: "18:30",
  },
  {
    id: "f2",
    titulo: "Conferir caixa e formas de pagamento",
    concluido: false,
    responsavel: "Gui",
    horario: "18:40",
  },
  {
    id: "f3",
    titulo: "Guardar aparelhos da vitrine no cofre",
    concluido: false,
    responsavel: "Ana",
    horario: "18:45",
  },
  {
    id: "f4",
    titulo: "Responder últimas mensagens do WhatsApp",
    concluido: false,
    responsavel: "Pedro",
    horario: "18:30",
  },
  {
    id: "f5",
    titulo: "Desligar sistemas e câmeras",
    concluido: false,
    responsavel: "Gui",
    horario: "19:00",
  },
]

export const mockEstoque: Aparelho[] = [
  {
    id: "1",
    modelo: "iPhone 15 Pro",
    capacidade: "256GB",
    cor: "Titânio Natural",
    tipo: "NOVO",
    status: "DISPONIVEL",
    preco: 8500,
    custo: 6200,
    dataEntrada: "2026-03-01",
    foneNinjaId: null,
  },
  {
    id: "2",
    modelo: "iPhone 15 Pro Max",
    capacidade: "512GB",
    cor: "Titânio Preto",
    tipo: "NOVO",
    status: "RESERVADO",
    preco: 11200,
    custo: 8100,
    cliente: "Roberto Lima",
    dataEntrada: "2026-03-01",
    foneNinjaId: null,
  },
  {
    id: "3",
    modelo: "iPhone 15",
    capacidade: "128GB",
    cor: "Rosa",
    tipo: "NOVO",
    status: "DISPONIVEL",
    preco: 6200,
    custo: 4600,
    dataEntrada: "2026-03-02",
    foneNinjaId: null,
  },
  {
    id: "4",
    modelo: "iPhone 14 Pro",
    capacidade: "256GB",
    cor: "Roxo Profundo",
    tipo: "SEMINOVO",
    status: "DISPONIVEL",
    preco: 5900,
    custo: 4200,
    imei: "35****1234",
    dataEntrada: "2026-02-28",
    observacao: "Bateria 91% — sem arranhões",
    foneNinjaId: null,
  },
  {
    id: "5",
    modelo: "iPhone 14",
    capacidade: "128GB",
    cor: "Azul",
    tipo: "SEMINOVO",
    status: "AGUARDANDO_RETIRADA",
    preco: 4800,
    custo: 3400,
    imei: "35****5678",
    cliente: "Maria Oliveira",
    dataEntrada: "2026-03-03",
    observacao: "Vendido — cliente retira hoje às 15h",
    foneNinjaId: null,
  },
  {
    id: "6",
    modelo: "iPhone 13",
    capacidade: "256GB",
    cor: "Meia-noite",
    tipo: "SEMINOVO",
    status: "DISPONIVEL",
    preco: 3900,
    custo: 2800,
    imei: "35****9012",
    dataEntrada: "2026-02-25",
    observacao: "Bateria 87% — película aplicada",
    foneNinjaId: null,
  },
  {
    id: "7",
    modelo: "iPhone 13",
    capacidade: "128GB",
    cor: "Estelar",
    tipo: "SEMINOVO",
    status: "DISPONIVEL",
    preco: 3200,
    custo: 2300,
    imei: "35****3456",
    dataEntrada: "2026-03-04",
    observacao: "Bateria 89%",
    foneNinjaId: null,
  },
]

export const mockTradeIns: Aparelho[] = [
  {
    id: "t1",
    modelo: "iPhone 12",
    capacidade: "64GB",
    cor: "Branco",
    tipo: "TRADE_IN",
    status: "EM_AVALIACAO",
    preco: 0,
    imei: "35****7890",
    cliente: "Carlos Mendes",
    dataEntrada: "2026-03-06",
    observacao: "Tela com pequeno risco — bateria a verificar",
  },
  {
    id: "t2",
    modelo: "iPhone 11",
    capacidade: "128GB",
    cor: "Preto",
    tipo: "TRADE_IN",
    status: "AVALIADO",
    preco: 1200,
    imei: "35****2345",
    cliente: "Fernanda Souza",
    dataEntrada: "2026-03-05",
    observacao: "Avaliado em R$ 1.200 — cliente aceitou o valor",
  },
  {
    id: "t3",
    modelo: "iPhone 13 Pro",
    capacidade: "256GB",
    cor: "Grafite",
    tipo: "TRADE_IN",
    status: "EM_AVALIACAO",
    preco: 0,
    imei: "35****6789",
    cliente: "Juliana Castro",
    dataEntrada: "2026-03-06",
    observacao: "Recebido hoje — aguarda avaliação técnica",
  },
]

export const mockResumoOperacao = {
  aberturaProgresso: 3,
  aberturaTotal: 6,
  fechamentoProgresso: 0,
  fechamentoTotal: 5,
  totalEstoque: 7,
  disponiveis: 5,
  reservados: 1,
  aguardandoRetirada: 1,
  tradeInsAbertos: 2,
  tradeInsAvaliados: 1,
}
