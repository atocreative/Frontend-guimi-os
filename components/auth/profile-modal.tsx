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
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    // Validação
    if (!senhaAtual.trim()) {
      toast.error("Digite sua senha atual")
      return
    }

    if (!novaSenha.trim()) {
      toast.error("Digite a nova senha")
      return
    }

    if (novaSenha.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres")
      return
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("Senhas não conferem")
      return
    }

    setSalvando(true)

    try {
      // Chama PATCH /api/users/me/password
      const response = await api.updateCurrentUserPassword({
        currentPassword: senhaAtual,
        newPassword: novaSenha,
      })

      toast.success("Senha alterada com sucesso!")
      setSenhaAtual("")
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
    setSenhaAtual("")
    setNovaSenha("")
    setConfirmarSenha("")
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle>Alterar Senha</SheetTitle>
          <SheetDescription>Altere sua senha com segurança</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="senha-atual">Senha Atual</Label>
            <Input
              id="senha-atual"
              type="password"
              placeholder="Digite sua senha atual"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              disabled={salvando}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nova-senha">Nova Senha</Label>
            <Input
              id="nova-senha"
              type="password"
              placeholder="Digite a nova senha"
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
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              disabled={salvando}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={handleClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
