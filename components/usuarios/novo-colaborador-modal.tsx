"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { userCreateSchema } from "@/lib/schemas"
import type { NovoUsuarioPayload, UsuarioSistema } from "@/types/usuarios"

interface NovoColaboradorModalProps {
  open: boolean
  onClose: () => void
  onCreated: (usuario: UsuarioSistema) => void
}

export function NovoColaboradorModal({
  open,
  onClose,
  onCreated,
}: NovoColaboradorModalProps) {
  const [form, setForm] = useState<NovoUsuarioPayload>({
    name: "",
    email: "",
    password: "",
    jobTitle: "",
    role: "COLABORADOR",
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    if (!open) return
    setForm({
      name: "",
      email: "",
      password: "",
      jobTitle: "",
      role: "COLABORADOR",
    })
    setErro("")
  }, [open])

  function updateField<K extends keyof NovoUsuarioPayload>(
    field: K,
    value: NovoUsuarioPayload[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function salvar() {
    setSalvando(true)
    setErro("")

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        jobTitle: form.jobTitle.trim(),
      }

      const parsed = userCreateSchema.safeParse(payload)
      if (!parsed.success) {
        setErro(parsed.error.issues[0]?.message ?? "Dados inválidos.")
        return
      }

      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setErro(typeof data?.error === "string" ? data.error : "Erro ao cadastrar colaborador.")
        return
      }

      const data = await res.json()
      onCreated(data.usuario)
      onClose()
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Novo Colaborador</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            salvar()
          }}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="novo-colaborador-nome">Nome completo *</Label>
            <Input
              id="novo-colaborador-nome"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="novo-colaborador-email">Email *</Label>
            <Input
              id="novo-colaborador-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="novo-colaborador-password">Senha *</Label>
            <Input
              id="novo-colaborador-password"
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="novo-colaborador-cargo">Cargo *</Label>
            <Input
              id="novo-colaborador-cargo"
              value={form.jobTitle}
              onChange={(event) => updateField("jobTitle", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(value) =>
                updateField("role", value as NovoUsuarioPayload["role"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                <SelectItem value="GESTOR">Gestor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {erro && <p className="text-xs text-destructive">{erro}</p>}
        </form>

        <SheetFooter className="px-4">
          <Button variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="button" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Cadastrar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
