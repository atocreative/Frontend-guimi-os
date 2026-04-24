export const mockFinanceiro = {
  faturamentoDia: 18500,
  faturamentoMes: 312000,
  metaMes: 400000,
  percentualMeta: 78,
  custosMes: 198000,
  lucroBruto: 114000,
  margemBruta: 36.5,
  despesasFixas: 28000,
  despesasVariaveis: 14000,
  totalDespesas: 42000,
  lucroLiquido: 72000,
  margemLiquida: 23.1,
  saldoCaixa: 89000,
  contasReceberMes: 47000,
  contasPagarMes: 31000,
}

export const mockComercial = {
  leadsNovos: 24,
  leadsPipeline: 67,
  leadsSemFollowUp: 11,
  taxaConversao: 31,
  ticketMedio: 4800,
  vendasMes: 65,
}

export const mockTarefas = [
  { id: "1", titulo: "Responder proposta cliente VIP", prioridade: "ALTA", prazo: "Hoje" },
  { id: "2", titulo: "Atualizar estoque seminovos", prioridade: "ALTA", prazo: "Hoje" },
  { id: "3", titulo: "Revisar contrato fornecedor", prioridade: "MEDIA", prazo: "Amanhã" },
  { id: "4", titulo: "Publicar stories produto novo", prioridade: "MEDIA", prazo: "Amanhã" },
  { id: "5", titulo: "Reunião com equipe comercial", prioridade: "BAIXA", prazo: "Sex" },
]

export const mockAlertas = [
  { id: "1", tipo: "urgente", mensagem: "11 leads sem contato há mais de 3 dias. Acesse o CRM para verificar a fila de atendimento urgente." },
  { id: "2", tipo: "atencao", mensagem: "A meta mensal está em 78%, faltando 8 dias úteis para o fechamento. Organize um 'Feirão de Trade-in' final." },
  { id: "3", tipo: "atencao", mensagem: "R$ 31.000 em contas a pagar. Verifique a tela Financeiro para escalonar os pagamentos dessa semana." },
  { id: "4", tipo: "info", mensagem: "Sincronização com Kommo há 2h atrás" },
]

export const mockCompromissos = [
  { id: "1", titulo: "Entrega iPhone 15 Pro — João Silva", horario: "10:00" },
  { id: "2", titulo: "Call com fornecedor", horario: "14:00" },
  { id: "3", titulo: "Avaliação trade-in — cliente novo", horario: "16:30" },
]

export const mockGraficoMensal = [
  { mes: "Out", faturamento: 278000, lucro: 61000, despesas: 38000 },
  { mes: "Nov", faturamento: 295000, lucro: 67000, despesas: 40000 },
  { mes: "Dez", faturamento: 341000, lucro: 89000, despesas: 43000 },
  { mes: "Jan", faturamento: 289000, lucro: 58000, despesas: 39000 },
  { mes: "Fev", faturamento: 305000, lucro: 71000, despesas: 41000 },
  { mes: "Mar", faturamento: 312000, lucro: 72000, despesas: 42000 },
]

export const mockGraficoDiario = [
  { dia: "Seg", faturamento: 14200, lucro: 3800 },
  { dia: "Ter", faturamento: 22100, lucro: 6100 },
  { dia: "Qua", faturamento: 18700, lucro: 4900 },
  { dia: "Qui", faturamento: 31400, lucro: 9200 },
  { dia: "Sex", faturamento: 28900, lucro: 7800 },
  { dia: "Sab", faturamento: 18500, lucro: 4800 },
]

// ============================================
// DADOS FINANCEIROS DETALHADOS
// ============================================

export const mockEntradas = [
  {
    id: "1",
    produto: "iPhone 15 Pro 256GB",
    categoria: "Novo",
    valorVenda: 8500,
    custo: 6200,
    lucro: 2300,
    margem: 27.1,
    formaPagamento: "PIX",
    vendedor: "Gui",
    cliente: "João Silva",
    data: "2026-03-06",
    foneNinjaId: null,
  },
  {
    id: "2",
    produto: "iPhone 14 128GB",
    categoria: "Seminovo",
    valorVenda: 4800,
    custo: 3400,
    lucro: 1400,
    margem: 29.2,
    formaPagamento: "Crédito",
    vendedor: "Gui",
    cliente: "Maria Oliveira",
    data: "2026-03-06",
    foneNinjaId: null,
  },
  {
    id: "3",
    produto: "iPhone 13 256GB",
    categoria: "Seminovo",
    valorVenda: 3900,
    custo: 2800,
    lucro: 1100,
    margem: 28.2,
    formaPagamento: "PIX",
    vendedor: "Gui",
    cliente: "Ana Costa",
    data: "2026-03-05",
    foneNinjaId: null,
  },
  {
    id: "4",
    produto: "iPhone 15 Pro Max 512GB",
    categoria: "Novo",
    valorVenda: 11200,
    custo: 8100,
    lucro: 3100,
    margem: 27.7,
    formaPagamento: "Débito",
    vendedor: "Gui",
    cliente: "Roberto Lima",
    data: "2026-03-05",
    foneNinjaId: null,
  },
  {
    id: "5",
    produto: "iPhone 15 128GB",
    categoria: "Novo",
    valorVenda: 6200,
    custo: 4600,
    lucro: 1600,
    margem: 25.8,
    formaPagamento: "PIX",
    vendedor: "Gui",
    cliente: "Carlos Mendes",
    data: "2026-03-04",
    foneNinjaId: null,
  },
  {
    id: "6",
    produto: "iPhone 14 Pro 256GB",
    categoria: "Seminovo",
    valorVenda: 5900,
    custo: 4200,
    lucro: 1700,
    margem: 28.8,
    formaPagamento: "Crédito",
    vendedor: "Gui",
    cliente: "Fernanda Souza",
    data: "2026-03-04",
    foneNinjaId: null,
  },
]

export const mockDespesas = [
  {
    id: "1",
    descricao: "Aluguel loja",
    categoria: "Fixo",
    valor: 8500,
    vencimento: "2026-03-10",
    pago: true,
    dataPagamento: "2026-03-05",
    meuAssessorId: null,
  },
  {
    id: "2",
    descricao: "Fornecedor Apple Premium",
    categoria: "Fornecedor",
    valor: 42000,
    vencimento: "2026-03-08",
    pago: true,
    dataPagamento: "2026-03-07",
    meuAssessorId: null,
  },
  {
    id: "3",
    descricao: "Salários",
    categoria: "Fixo",
    valor: 12000,
    vencimento: "2026-03-05",
    pago: true,
    dataPagamento: "2026-03-05",
    meuAssessorId: null,
  },
  {
    id: "4",
    descricao: "Meta Ads / Instagram",
    categoria: "Marketing",
    valor: 3500,
    vencimento: "2026-03-15",
    pago: false,
    dataPagamento: null,
    meuAssessorId: null,
  },
  {
    id: "5",
    descricao: "Sistema Kommo CRM",
    categoria: "Software",
    valor: 890,
    vencimento: "2026-03-20",
    pago: false,
    dataPagamento: null,
    meuAssessorId: null,
  },
  {
    id: "6",
    descricao: "Energia elétrica",
    categoria: "Fixo",
    valor: 1200,
    vencimento: "2026-03-18",
    pago: false,
    dataPagamento: null,
    meuAssessorId: null,
  },
  {
    id: "7",
    descricao: "Internet e telefonia",
    categoria: "Fixo",
    valor: 650,
    vencimento: "2026-03-18",
    pago: false,
    dataPagamento: null,
    meuAssessorId: null,
  },
  {
    id: "8",
    descricao: "Material de escritório",
    categoria: "Variável",
    valor: 380,
    vencimento: "2026-03-12",
    pago: true,
    dataPagamento: "2026-03-10",
    meuAssessorId: null,
  },
]

export const mockFluxoCaixa = [
  { data: "01/03", entradas: 14200, saidas: 8500, saldo: 94700 },
  { data: "02/03", entradas: 0, saidas: 0, saldo: 94700 },
  { data: "03/03", entradas: 22100, saidas: 42000, saldo: 74800 },
  { data: "04/03", entradas: 12100, saidas: 12000, saldo: 74900 },
  { data: "05/03", entradas: 18700, saidas: 380, saldo: 93220 },
  { data: "06/03", entradas: 13300, saidas: 0, saldo: 106520 },
  { data: "Prev 07", entradas: 0, saidas: 0, saldo: 106520 },
  { data: "Prev 08", entradas: 0, saidas: 0, saldo: 106520 },
  { data: "Prev 10", entradas: 0, saidas: 8500, saldo: 98020 },
  { data: "Prev 12", entradas: 0, saidas: 380, saldo: 97640 },
  { data: "Prev 15", entradas: 0, saidas: 3500, saldo: 94140 },
  { data: "Prev 18", entradas: 0, saidas: 1850, saldo: 92290 },
  { data: "Prev 20", entradas: 0, saidas: 890, saldo: 91400 },
]

export const mockCategoriasDespesa = [
  { categoria: "Fornecedor", valor: 42000, percentual: 60.8 },
  { categoria: "Fixo", valor: 22350, percentual: 32.3 },
  { categoria: "Marketing", valor: 3500, percentual: 5.1 },
  { categoria: "Software", valor: 890, percentual: 1.3 },
  { categoria: "Variável", valor: 380, percentual: 0.5 },
]

// ============================================
// DADOS DE INDICADORES
// ============================================

export const mockIndicadoresTime = [
  {
    id: "1",
    nome: "Gui",
    avatar: "G",
    role: "ADMIN",
    vendasMes: 142,
    faturamentoMes: 142000,
    ticketMedio: 5071,
    taxaConversao: 38,
    leadsAtivos: 24,
    metaMes: 160,
    percentualMeta: 88.75,
    medalhas: ["top-ticket", "sem-atrasos"],
  },
  {
    id: "2",
    nome: "Ana",
    avatar: "A",
    role: "COLABORADOR",
    vendasMes: 98,
    faturamentoMes: 98000,
    ticketMedio: 4454,
    taxaConversao: 31,
    leadsAtivos: 28,
    metaMes: 100,
    percentualMeta: 98,
    medalhas: ["quase-meta", "mais-leads"],
  },
  {
    id: "3",
    nome: "Pedro",
    avatar: "P",
    role: "COLABORADOR",
    vendasMes: 72,
    faturamentoMes: 72000,
    ticketMedio: 4800,
    taxaConversao: 27,
    leadsAtivos: 15,
    metaMes: 80,
    percentualMeta: 90,
    medalhas: ["constante"],
  },
]

export const mockEvolucaoIndicadores = [
  { mes: "Out", lucro: 61000 },
  { mes: "Nov", lucro: 67000 },
  { mes: "Dez", lucro: 89000 },
  { mes: "Jan", lucro: 58000 },
  { mes: "Fev", lucro: 71000 },
  { mes: "Mar", lucro: 72000 },
]

export const mockOrigemLeads = [
  { origem: "Instagram", leads: 34, convertidos: 12, conversao: 35.3 },
  { origem: "Indicação", leads: 18, convertidos: 9, conversao: 50 },
  { origem: "WhatsApp", leads: 22, convertidos: 6, conversao: 27.3 },
  { origem: "Google", leads: 8, convertidos: 2, conversao: 25 },
]

export const mockAlertasIndicadores = [
  {
    id: "1",
    tipo: "atencao" as const,
    mensagem: "Taxa de conversão caiu 1pp (33% → 32%). Sugerimos revisar o roteiro de abordagem na loja."
  },
  {
    id: "2",
    tipo: "info" as const,
    mensagem: "Indicação converte em 50%! Incentive os vendedores a pedirem mais referências aos clientes."
  },
  {
    id: "3",
    tipo: "urgente" as const,
    mensagem: "Pedro está há 2 meses com conversão abaixo de 30%. Agende uma reunião de alinhamento com ele."
  },
]

// ============================================
// DADOS DE COLABORADORES
// ============================================

export const mockColaboradores = [
  {
    id: "1",
    nome: "Gui",
    email: "gui@guimicell.com.br",
    cargo: "CEO & Fundador",
    avatar: "G",
    role: "ADMIN",
    tempoEmpresa: "3 anos",
    telefone: "(61) 99999-0001",
    aniversario: "15/08",
    ativo: true,
    pontosMes: 1840,
    pontosTotal: 24200,
    nivel: "Lenda",
    nivelProgresso: 84,
    sequenciaDias: 22,
    conquistasDesbloqueadas: [
      "primeiro-milhao",
      "100-vendas",
      "lider-mes",
      "sem-faltas",
      "top-ticket",
      "mentor",
    ],
    metaMes: 160,
    realizadoMes: 142,
  },
  {
    id: "2",
    nome: "Ana",
    email: "ana@guimicell.com.br",
    cargo: "Consultora Comercial",
    avatar: "A",
    role: "COLABORADOR",
    tempoEmpresa: "1 ano e 1 mês",
    telefone: "(61) 99999-0002",
    aniversario: "03/04",
    ativo: true,
    pontosMes: 1620,
    pontosTotal: 11400,
    nivel: "Expert",
    nivelProgresso: 62,
    sequenciaDias: 18,
    conquistasDesbloqueadas: [
      "primeira-venda",
      "10-vendas",
      "mais-leads",
      "sem-faltas",
    ],
    metaMes: 100,
    realizadoMes: 98,
  },
  {
    id: "3",
    nome: "Pedro",
    email: "pedro@guimicell.com.br",
    cargo: "Consultor Comercial",
    avatar: "P",
    role: "COLABORADOR",
    tempoEmpresa: "8 meses",
    telefone: "(61) 99999-0003",
    aniversario: "27/11",
    ativo: true,
    pontosMes: 980,
    pontosTotal: 6800,
    nivel: "Avançado",
    nivelProgresso: 38,
    sequenciaDias: 12,
    conquistasDesbloqueadas: [
      "primeira-venda",
      "10-vendas",
      "constante",
    ],
    metaMes: 80,
    realizadoMes: 72,
  },
]

export const mockConquistas = [
  {
    id: "primeira-venda",
    titulo: "Primeira Venda",
    descricao: "Realizou a primeira venda no sistema",
    emoji: "🎯",
    raridade: "comum",
  },
  {
    id: "10-vendas",
    titulo: "10 Vendas",
    descricao: "Completou 10 vendas no mês",
    emoji: "🔟",
    raridade: "comum",
  },
  {
    id: "100-vendas",
    titulo: "100 Vendas",
    descricao: "Marco de 100 vendas acumuladas",
    emoji: "💯",
    raridade: "raro",
  },
  {
    id: "primeiro-milhao",
    titulo: "Primeiro Milhão",
    descricao: "R$ 1.000.000 em faturamento acumulado",
    emoji: "💰",
    raridade: "epico",
  },
  {
    id: "lider-mes",
    titulo: "Líder do Mês",
    descricao: "1º lugar no ranking mensal",
    emoji: "🏆",
    raridade: "raro",
  },
  {
    id: "top-ticket",
    titulo: "Maior Ticket",
    descricao: "Melhor ticket médio do time no mês",
    emoji: "💎",
    raridade: "raro",
  },
  {
    id: "mais-leads",
    titulo: "Mais Leads",
    descricao: "Maior volume de leads ativos no mês",
    emoji: "📈",
    raridade: "comum",
  },
  {
    id: "sem-faltas",
    titulo: "Presença Total",
    descricao: "Sem faltas no mês",
    emoji: "⚡",
    raridade: "comum",
  },
  {
    id: "constante",
    titulo: "Consistente",
    descricao: "3 meses consecutivos batendo meta",
    emoji: "🔄",
    raridade: "raro",
  },
  {
    id: "mentor",
    titulo: "Mentor",
    descricao: "Ajudou a treinar um novo colaborador",
    emoji: "🎓",
    raridade: "epico",
  },
]

export const mockPodio = {
  primeiro: "Gui",
  segundo: "Ana",
  terceiro: "Pedro",
}
