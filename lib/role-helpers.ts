export type AppRole = "SUPER_USER" | "ADMIN" | "GERENTE" | "COLABORADOR"

export function canViewFinancialData(role: string | undefined): boolean {
  return role === "SUPER_USER" || role === "ADMIN"
}

export function canViewSalesRanking(role: string | undefined): boolean {
  return role !== "COLABORADOR"
}

export function isColaborador(role: string | undefined): boolean {
  return role === "COLABORADOR"
}

export function isGerente(role: string | undefined): boolean {
  return role === "GERENTE"
}
