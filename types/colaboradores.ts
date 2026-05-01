import type { RoleUsuario } from "@/types/usuarios"

export interface ColaboradorResumo {
  id: string
  nome: string
  email: string
  avatar: string
  role: RoleUsuario
  ativo: boolean
  jobTitle?: string
  tempoEmpresa: string
  telefone: string
  nivel: string
  nivelProgresso: number
  sequenciaDias: number
  pontosMes: number
  metaMes: number
  realizadoMes: number
  vendasMes: number
  ticketMedio: number
  taxaConversao: number
  conquistasDesbloqueadas: string[]
}
