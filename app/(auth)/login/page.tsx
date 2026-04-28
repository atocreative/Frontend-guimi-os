"use client"

import { useState } from "react"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MfaModal } from "@/components/auth/mfa-modal"
import { api, ApiError } from "@/lib/api-client"
import { loginSchema } from "@/lib/schemas"

type LoginForm = {
  email: string
  password: string
}

type AuthenticatedUser = {
  id: string
  name: string
  email: string
  role: string
  jobTitle?: string | null
}

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [challengeToken, setChallengeToken] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function finalizeSession(payload: { token: string; user: AuthenticatedUser }) {
    const result = await signIn("credentials", {
      mode: "token",
      token: payload.token,
      user: JSON.stringify(payload.user),
      redirect: false,
    })

    if (result?.error) {
      throw new Error("Não foi possível iniciar a sessão.")
    }

    router.push("/")
    router.refresh()
  }

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setError("")

    try {
      const result = await api.login(data)

      if (result?.mfaRequired && result?.challengeToken) {
        setChallengeToken(result.challengeToken)
        return
      }

      await finalizeSession({ token: result.token, user: result.user })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Email ou senha incorretos.")
        } else {
          setError(err.message || "Não foi possível entrar agora.")
        }
      } else {
        setError("Não foi possível entrar agora.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-full max-w-sm px-6">
          <div className="mb-8 flex flex-col items-center gap-3">
            <Image
              src="/logo.webp"
              alt="Guimicell"
              width={80}
              height={80}
              className="rounded-xl"
              priority
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Guimicell <span className="text-zinc-400">OS</span>
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Painel operacional interno
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-zinc-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="gui@guimicell.com.br"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-zinc-300">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white font-medium text-zinc-900 hover:bg-zinc-100"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-600">
            Acesso restrito · GuimiCell © 2026
          </p>
        </div>
      </div>

      {challengeToken && (
        <MfaModal
          challengeToken={challengeToken}
          onSuccess={async ({ token, user }) => {
            await finalizeSession({ token, user })
          }}
        />
      )}
    </>
  )
}
