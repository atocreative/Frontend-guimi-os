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
import { RefreshCcw, Moon, Sun, AlertCircle } from "lucide-react"
import { useTheme } from "next-themes"

// --- Tipos ---
type LoginForm = { email: string; password: string }
type AuthenticatedUser = { id: string; name: string; email: string; role: string; jobTitle?: string | null }
type CaptchaChallenge = { token: string; question: string; answer?: string }

// --- Suporte ---
async function fetchCaptchaChallenge(): Promise<CaptchaChallenge> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/auth/captcha`)
    if (!response.ok) throw new Error("Erro captcha")
    const data = await response.json()
    const match = data.data.question.match(/(\d+)\s*([\+\-])\s*(\d+)/)
    let answer = ""
    if (match) {
      const left = parseInt(match[1]), operator = match[2], right = parseInt(match[3])
      answer = String(operator === "+" ? left + right : left - right)
    }
    return { token: data.data.token, question: data.data.question, answer }
  } catch (error) { throw new Error("Erro") }
}

export default function LoginPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [captchaChallenge, setCaptchaChallenge] = useState<CaptchaChallenge | null>(null)
  const [captchaValue, setCaptchaValue] = useState("")
  const [captchaKey, setCaptchaKey] = useState(Date.now())

  useEffect(() => setMounted(true), [])
  
  useEffect(() => {
    fetchCaptchaChallenge().then(setCaptchaChallenge).catch(() => setError("Erro no anti-robô"))
  }, [captchaKey])

  useEffect(() => {
    const interval = setInterval(() => {
      setCaptchaKey(Date.now())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const captchaSolved = useMemo(() => captchaChallenge && captchaValue.trim() === captchaChallenge.answer, [captchaChallenge, captchaValue])

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setError("")
    try {
      if (!captchaSolved) return setError("Resolva o desafio primeiro.")
      const result = await api.login({ ...data, captchaToken: captchaChallenge!.token, captchaAnswer: captchaValue.trim() })
      const authResult = await signIn("credentials", { mode: "token", token: result.accessToken, user: JSON.stringify(result.user), redirect: false })
      if (authResult?.error) throw new Error()
      setCaptchaKey(Date.now())
      setCaptchaValue("")
      router.push("/")
      router.refresh()
    } catch (err) { 
      setCaptchaKey(Date.now())
      setCaptchaValue("")
      setError("Credenciais inválidas. Tente novamente.") 
      setTimeout(() => setError(""), 4000)
    } finally { setLoading(false) }
  }

  if (!mounted) return null

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden transition-colors duration-500 font-sans select-none">
      
      {/* SEÇÃO DE LOGIN: Centralizada em mobile/tablet e Lateral em Desktop (LG) */}
      <div className="relative flex w-full flex-col justify-between py-10 px-8 lg:w-[500px] xl:w-[600px] bg-card lg:border-r border-border shrink-0 z-30 shadow-2xl items-center">
        
        {/* Toggle Theme - Posicionado estrategicamente para não quebrar o alinhamento */}
        <div className="absolute top-6 right-6 lg:top-8 lg:right-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
            className="rounded-full hover:bg-muted cursor-pointer transition-all active:scale-90"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {/* 1. Topo: Logo e Títulos */}
        <div className="flex flex-col items-center gap-4 text-center lg:text-left lg:items-start lg:mt-4">
          <div className="relative h-28 w-28 lg:h-24 lg:w-24 items-center flex justify-center">
            <Image src="/logo.webp" alt="Guimicell" fill className="object-contain" priority />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Acesse sua conta</h1>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Painel operacional interno Guimicell OS</p>
          </div>
        </div>

        {/* 2. Centro: Formulário (Max-width garante que não estique demais) */}
        <div className="w-full max-w-[340px] mx-auto lg:mx-0 relative py-8 lg:py-0">
          
          {/* Alerta de erro flutuante */}
          {error && (
            <div className="absolute -top-12 left-0 right-0 flex justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 bg-destructive/95 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg border border-destructive uppercase tracking-tighter">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">E-mail</Label>
                <Input id="email" type="email" placeholder="examplo@guimicell.com.br" className="bg-background h-12 focus:ring-2 focus:ring-secondary/20 border-input" {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password font-black text-muted-foreground uppercase tracking-widest text-[10px]">Senha</Label>
                <Input id="password" type="password" placeholder="Sua senha de 8 dígitos" className="bg-background h-12 focus:ring-2 focus:ring-secondary/20 border-input" {...register("password")} />
              </div>

              {/* Caixa de Segurança / Captcha */}
              <div key={captchaKey} className="rounded-xl border border-border bg-muted/20 p-4 space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                  <span>Segurança</span>
                  <RefreshCcw className="h-3.5 w-3.5 cursor-pointer hover:rotate-180 transition-all duration-500" onClick={() => { setCaptchaKey(Date.now()); setCaptchaValue("") }} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-[12px] font-black bg-background py-2.5 px-3 rounded-lg border text-center font-mono text-foreground/90">
                    {captchaChallenge?.question || "Calculando..."}
                  </div>
                  <Input maxLength={2} value={captchaValue} onChange={(e) => setCaptchaValue(e.target.value.replace(/\D/g, ""))} className="w-16 h-11 text-center font-bold bg-background text-lg border-input focus:border-secondary" placeholder="?" />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || !captchaSolved} 
              className="w-full h-14 text-[12px] font-black bg-secondary hover:bg-secondary/90 text-white shadow-xl shadow-secondary/30 transition-all cursor-pointer uppercase tracking-[0.2em] active:scale-[0.97] disabled:opacity-30 disabled:grayscale"
            >
              {loading ? "Entrando..." : "Entrar no Sistema"}
            </Button>
          </form>
        </div>

        {/* 3. Rodapé */}
        <footer className="text-center lg:text-left space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">GuimiCell OS © 2026</p>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.1em]">Desenvolvido por <span className="text-foreground/80 font-black">ATO.</span></p>
        </footer>
      </div>

      {/* LADO DIREITO: Split - Somente acima de 1024px (LG) */}
      <div className="relative hidden lg:flex flex-1 flex-col overflow-hidden bg-zinc-950">
        <Image src="/bg.jpg" alt="Background" fill className="object-cover z-0" priority />
        
        {/* Elementos Abstratos */}
        <div className="absolute inset-0 z-1 pointer-events-none">
          <div className="absolute top-[15%] left-[5%] w-[40vw] h-[40vw] rounded-full bg-secondary/25 blur-[120px] animate-pulse duration-[6s]" />
          <div className="absolute bottom-[5%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-white/10 blur-[100px] animate-pulse duration-[10s]" />
        </div>

        {/* Texto Dinâmico */}
        <div className="relative z-10 w-full px-[5vw] pt-[10vh]">
          <div className="max-w-[40vw] space-y-4 drop-shadow-2xl">
            <p className="text-[2.2vw] text-white/95 font-light leading-tight tracking-tight">
              Gerenciar o financeiro e a equipe da sua loja nunca foi tão eficiente.
            </p>
            <p className="text-[2.2vw] text-white font-black tracking-tight">
              Moderno, dinâmico e fácil de usar.
            </p>
          </div>
        </div>

        {/* Celulares Pulsantes */}
        <div className="relative mt-auto w-full h-[65%] flex justify-end items-end p-[2vw] z-10">
          <div className="relative w-[90%] h-full animate-soft-pulse">
            <Image 
              src="/cell.png" 
              alt="Mobiles" 
              fill 
              className="object-contain object-right-bottom drop-shadow-[0_45px_40px_rgba(0,0,0,0.8)]" 
            />
          </div>
        </div>

        {/* Gradiente de Base */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-5" />
      </div>

      <style jsx global>{`
        @keyframes soft-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        .animate-soft-pulse {
          animation: soft-pulse 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
