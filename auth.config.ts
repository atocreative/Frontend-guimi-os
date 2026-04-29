import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("[JWT Callback] User object received:", {
          hasUser: !!user,
          hasAccessToken: !!user.accessToken,
          accessTokenLength: (user as any).accessToken?.length,
          userKeys: Object.keys(user),
        })

        token.id = user.id
        token.role = user.role
        token.jobTitle = user.jobTitle ?? null
        token.accessToken = String((user as any).accessToken || "")
        token.raw_token = String((user as any).accessToken || "")

        console.log("[JWT Callback] Token after assignment:", {
          tokenAccessToken: (token as any).accessToken?.substring(0, 50),
          tokenRawToken: (token as any).raw_token?.substring(0, 50),
        })

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
        console.log("[Session Callback] Token object:", {
          hasAccessToken: !!(token as any).accessToken,
          accessTokenLength: (token as any).accessToken?.length,
          raw_token: (token as any).raw_token?.substring(0, 50),
        })

        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.jobTitle = (token.jobTitle as string | null | undefined) ?? null
        session.accessToken = String((token as any).accessToken || "")

        console.log("[Session Callback] Session after assignment:", {
          sessionAccessToken: session.accessToken?.substring(0, 50),
        })

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
