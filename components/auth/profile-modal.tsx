"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, ApiError } from "@/lib/api-client"

interface ProfileModalProps {
  open: boolean
  onClose: () => void
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!novaSenha || !confirmarSenha) {
      toast.error("Preencha todos os campos")
      return
    }

    if (novaSenha.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres")
      return
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem")
      return
    }

    setSalvando(true)

    try {
      await api.updateCurrentUserPassword(novaSenha)
      toast.success("Senha alterada com sucesso!")
      setNovaSenha("")
      setConfirmarSenha("")
      onClose()
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as { message?: string; error?: string } | undefined
        toast.error(data?.message || data?.error || "Erro ao alterar senha")
      } else {
        toast.error("Erro ao alterar senha")
      }
      console.error("[ProfileModal] Erro:", err)
    } finally {
      setSalvando(false)
    }
  }

  function handleClose() {
    setNovaSenha("")
    setConfirmarSenha("")
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-96 p-6" style={{ willChange: "transform, opacity" }}>
        <SheetHeader>
          <SheetTitle>Alterar Senha</SheetTitle>
          <SheetDescription>Altere sua senha com segurança</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label htmlFor="nova-senha">Nova Senha</Label>
            <Input
              id="nova-senha"
              type="password"
              placeholder="Digite a nova senha"
              className="h-11"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              disabled={salvando}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar-senha">Confirmar Senha</Label>
            <Input
              id="confirmar-senha"
              type="password"
              placeholder="Confirme a nova senha"
              className="h-11"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              disabled={salvando}
            />
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-2">
          <Button
            onClick={salvar}
            disabled={salvando}
            className="w-full cursor-pointer hover:opacity-90 transition"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={salvando}
            className="w-full cursor-pointer hover:bg-gray-100 transition"
          >
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
