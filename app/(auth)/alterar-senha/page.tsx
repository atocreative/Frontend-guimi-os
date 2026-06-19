"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api-client"
import { AtoLogo } from "@/components/ui/ato-logo"
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"

const DEFAULT_PASSWORD = "guimicell123"

const schema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .refine((v) => v !== DEFAULT_PASSWORD, "Nova senha não pode ser a senha inicial"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof schema>

export default function AlterarSenhaPage() {
  const { update } = useSession()
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError("")
    try {
      await api.updateCurrentUserPassword(data.newPassword, data.currentPassword)
      // Clear mustChangePassword in the JWT session without full re-login
      await update({ mustChangePassword: false })
      router.push("/")
      router.refresh()
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || ""
      setError(
        msg.toLowerCase().includes("inválida") || msg.toLowerCase().includes("invalid")
          ? "Senha atual incorreta. Tente novamente."
          : "Erro ao alterar senha. Tente novamente."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4 font-sans select-none">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative h-20 w-full">
            <Image src="/logo.webp" alt="Guimicell" fill className="object-contain" priority />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Troca de senha obrigatória</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Crie uma senha pessoal para continuar
            </p>
          </div>
        </div>

        {/* Alert box */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Por segurança, sua senha inicial deve ser trocada antes de acessar o sistema.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Current password */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Senha atual
            </Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="Sua senha atual"
                className="h-12 pr-10 bg-card border-input"
                {...register("currentPassword")}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* New password */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Nova senha
            </Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                className="h-12 pr-10 bg-card border-input"
                {...register("newPassword")}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Confirmar nova senha
            </Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Repita a nova senha"
                className="h-12 pr-10 bg-card border-input"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* API error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 text-[12px] font-black bg-secondary hover:bg-secondary/90 text-white transition-all cursor-pointer uppercase tracking-[0.2em] active:scale-[0.97] disabled:opacity-30"
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>

        <footer className="text-center space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">GuimiCell OS © 2026</p>
          <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/50 uppercase tracking-[0.1em]">
            Desenvolvido por <AtoLogo height={12} />
          </p>
        </footer>
      </div>
    </div>
  )
}
