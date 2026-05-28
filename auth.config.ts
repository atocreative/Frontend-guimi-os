import type { NextAuthConfig } from "next-auth"

function isBackendJwtExpired(accessToken: string): boolean {
  try {
    const parts = accessToken.split(".")
    if (parts.length !== 3) return false
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(atob(base64)) as { exp?: number }
    if (!payload.exp) return false
    return Date.now() / 1000 > payload.exp
  } catch {
    return false
  }
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // ── TEMP DEBUG ──────────────────────────────────────────────────────
      console.log("[jwt cb] user exists:", !!user)
      console.log("[jwt cb] token keys:", Object.keys(token))
      console.log("[jwt cb] token.accessToken exists:", !!(token as any).accessToken)
      console.log("[jwt cb] token.accessToken length:", ((token as any).accessToken as string | undefined)?.length ?? 0)
      // ────────────────────────────────────────────────────────────────────
      if (user) {

        token.id = user.id
        // Map roles to Scope 2: SUPER_USER, ADMIN, GERENTE, COLABORADOR
        let normalizedRole = user.role
        if (normalizedRole === "Developer") normalizedRole = "SUPER_USER"
        if (normalizedRole === "GESTOR") normalizedRole = "GERENTE" // Backend might send GESTOR
        token.role = normalizedRole
        token.isSuperUser = Boolean((user as any).isSuperUser || normalizedRole === "SUPER_USER")
        token.jobTitle = user.jobTitle ?? null
        token.accessToken = String((user as any).accessToken || "")
        token.raw_token = String((user as any).accessToken || "")


        if (user.name) {
          token.name = user.name
        }

        if (user.email) {
          token.email = user.email
        }
      }

      // Invalidate session when backend JWT has expired — forces clean re-login
      const accessToken = (token as any).accessToken as string | undefined
      if (accessToken && isBackendJwtExpired(accessToken)) {
        return null
      }

      return token
    },
    async session({ session, token }) {
      // ── TEMP DEBUG ──────────────────────────────────────────────────────
      console.log("[session cb] token.accessToken:", ((token as any).accessToken as string | undefined)?.slice(0, 20) ?? "null")
      // ────────────────────────────────────────────────────────────────────
      if (token) {

        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isSuperUser = Boolean((token as any).isSuperUser)
        session.user.jobTitle = (token.jobTitle as string | null | undefined) ?? null
        session.accessToken = String((token as any).accessToken || "")


        if (token.name) {
          session.user.name = token.name
        }

        if (token.email) {
          session.user.email = token.email
        }
      }

      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
