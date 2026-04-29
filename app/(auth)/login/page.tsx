"use client"

import { useMemo, useState, useEffect } from "react"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

type CaptchaChallenge = {
  seed: string
  question: string
  answer: string
}

function createCaptchaChallenge(): CaptchaChallenge {
  const left = Math.floor(Math.random() * 8) + 2
  const right = Math.floor(Math.random() * 8) + 1
  const useAddition = Math.random() >= 0.5

  const normalizedLeft = useAddition ? left : Math.max(left, right)
  const normalizedRight = useAddition ? right : Math.min(left, right)
  const operator = useAddition ? "+" : "-"
  const answer = useAddition
    ? normalizedLeft + normalizedRight
    : normalizedLeft - normalizedRight

  return {
    seed: `${normalizedLeft}:${normalizedRight}:${operator}`,
    question: `Quanto é ${normalizedLeft} ${operator} ${normalizedRight}?`,
    answer: String(answer),
  }
}

function isCaptchaError(error: ApiError) {
  const details = JSON.stringify(error.data ?? "").toLowerCase()
  const message = `${error.message} ${details}`.toLowerCase()

  return error.status === 400 && (message.includes("captcha") || message.includes("desafio"))
}

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [captchaChallenge, setCaptchaChallenge] = useState<CaptchaChallenge | null>(null)
  const [captchaValue, setCaptchaValue] = useState("")

  useEffect(() => {
    setCaptchaChallenge(createCaptchaChallenge())
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const captchaSolved = useMemo(
    () => captchaChallenge && captchaValue.trim() === captchaChallenge.answer,
    [captchaChallenge, captchaValue]
  )

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
      if (!captchaSolved) {
        setError("Resolva o desafio anti-robô para continuar.")
        return
      }

      const result = await api.login({
        ...data,
        captchaSeed: captchaChallenge!.seed,
        captchaAnswer: captchaValue.trim(),
      })

      if (result?.mfaRequired) {
        setError("O backend ainda está exigindo MFA para esta conta. Atualize a configuração da conta admin.")
        return
      }

      console.log("[Login Debug] Token recebido do backend:", {
        tokenLength: result.token?.length,
        tokenPrefix: result.token?.substring(0, 50),
        user: result.user,
      })
      await finalizeSession({ token: result.token, user: result.user })
    } catch (err) {
      if (err instanceof ApiError) {
        if (isCaptchaError(err)) {
          setCaptchaChallenge(createCaptchaChallenge())
          setCaptchaValue("")
          setError("Captcha inválido. Resolva o desafio novamente.")
        } else if (err.status === 401) {
          setError("Email ou senha incorretos.")
        } else if (err.status === 403 && `${err.message} ${JSON.stringify(err.data ?? {})}`.toLowerCase().includes("mfa")) {
          setError("O backend ainda está exigindo MFA para esta conta. Atualize a configuração da conta admin.")
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
              loading="lazy"
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

              <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="captcha-answer" className="text-zinc-300">
                    Desafio anti-robô
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCaptchaChallenge(createCaptchaChallenge())
                      setCaptchaValue("")
                    }}
                  >
                    Novo desafio
                  </Button>
                </div>
                <p data-testid="captcha-question" className="text-sm text-zinc-100">
                  {captchaChallenge?.question || "Carregando desafio..."}
                </p>
                <Input
                  id="captcha-answer"
                  data-testid="captcha-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={2}
                  placeholder="Resposta"
                  value={captchaValue}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500"
                  onChange={(event) => {
                    const next = event.target.value.replace(/\D/g, "").slice(0, 2)
                    setCaptchaValue(next)
                    if (error) {
                      setError("")
                    }
                  }}
                />
                <p className="text-xs text-zinc-500">
                  Resolva o desafio para liberar o envio do login.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !captchaSolved}
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
    </>
  )
}
