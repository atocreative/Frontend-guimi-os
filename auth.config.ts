import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.jobTitle = user.jobTitle ?? null
        token.accessToken = user.accessToken

        if (user.name) {
          token.name = user.name
        }

        if (user.email) {
          token.email = user.email
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.jobTitle = (token.jobTitle as string | null | undefined) ?? null
        session.accessToken = token.accessToken as string | undefined

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
