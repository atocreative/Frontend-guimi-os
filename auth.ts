import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { authConfig } from "./auth.config"

const sessionUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  jobTitle: z.string().nullable().optional(),
})

const tokenSessionSchema = z.object({
  mode: z.literal("token"),
  token: z.string().min(1),
  user: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        mode: { label: "Mode", type: "text" },
        token: { label: "Token", type: "text" },
        user: { label: "User", type: "text" },
      },
      async authorize(credentials) {
        const parsed = tokenSessionSchema.safeParse(credentials)

        if (!parsed.success) {
          return null
        }

        let rawUser: unknown

        try {
          rawUser = JSON.parse(parsed.data.user)
        } catch {
          return null
        }

        const user = sessionUserSchema.safeParse(rawUser)

        if (!user.success) {
          return null
        }

        return {
          id: user.data.id,
          name: user.data.name,
          email: user.data.email,
          role: user.data.role,
          jobTitle: user.data.jobTitle ?? null,
          accessToken: parsed.data.token,
        }
      },
    }),
  ],
})
