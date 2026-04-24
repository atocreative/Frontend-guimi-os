export type RoleUsuario = "ADMIN" | "GESTOR" | "COLABORADOR"

export interface UsuarioConfig {
  id: string
  nome: string
  email: string
  role: RoleUsuario
  ativo: boolean
  avatar: string
  criadoEm: string
  ultimoAcesso: string
}

export interface IntegracaoConfig {
  id: string
  nome: string
  descricao: string
  status: "CONECTADO" | "DESCONECTADO" | "ERRO" | "PENDENTE"
  ultimaSincronizacao: string | null
  registrosImportados: number
  icone: string
  fonte: string
}

export const mockUsuarios: UsuarioConfig[] = [
  {
    id: "1",
    nome: "Gui",
    email: "gui@guimicell.com.br",
    role: "ADMIN",
    ativo: true,
    avatar: "G",
    criadoEm: "2026-01-01",
    ultimoAcesso: "Agora",
  },
  {
    id: "2",
    nome: "Ana",
    email: "ana@guimicell.com.br",
    role: "COLABORADOR",
    ativo: true,
    avatar: "A",
    criadoEm: "2026-02-01",
    ultimoAcesso: "Hoje, 09:30",
  },
  {
    id: "3",
    nome: "Pedro",
    email: "pedro@guimicell.com.br",
    role: "COLABORADOR",
    ativo: true,
    avatar: "P",
    criadoEm: "2026-02-15",
    ultimoAcesso: "Hoje, 08:45",
  },
]

export const mockIntegracoes: IntegracaoConfig[] = [
  {
    id: "kommo",
    nome: "Kommo CRM",
    descricao: "Leads, pipeline e atividades comerciais",
    status: "PENDENTE",
    ultimaSincronizacao: null,
    registrosImportados: 0,
    icone: "K",
    fonte: "Comercial",
  },
  {
    id: "fone-ninja",
    nome: "Fone Ninja",
    descricao: "Vendas, entradas e produtos",
    status: "PENDENTE",
    ultimaSincronizacao: null,
    registrosImportados: 0,
    icone: "F",
    fonte: "Financeiro",
  },
  {
    id: "meu-assessor",
    nome: "Meu Assessor",
    descricao: "Despesas, saídas e contas a pagar",
    status: "PENDENTE",
    ultimaSincronizacao: null,
    registrosImportados: 0,
    icone: "M",
    fonte: "Financeiro",
  },
]

export const mockSistema = {
  versao: "1.0.0-beta",
  empresa: "GuimiCell",
  fusoHorario: "America/Sao_Paulo",
  ambiente: "Produção",
  banco: "PostgreSQL — Supabase",
  deploy: "Netlify",
  ultimaAtualizacao: "2026-03-06",
}
