export type RoleUsuario = "ADMIN" | "GESTOR" | "COLABORADOR"

export interface UsuarioSistema {
  id: string
  name: string
  email: string
  role: RoleUsuario
  avatarUrl: string | null
  jobTitle: string | null
  active: boolean
  createdAt: string
  updatedAt?: string
}

export type UsuarioDB = UsuarioSistema

export interface NovoUsuarioPayload {
  name: string
  email: string
  password: string
  jobTitle: string
  role: Exclude<RoleUsuario, "ADMIN">
}
