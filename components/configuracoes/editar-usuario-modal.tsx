"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
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
import { Checkbox } from "@/components/ui/checkbox"
import { api, ApiError } from "@/lib/api-client"
import type { RoleUsuario, UsuarioSistema } from "@/types/usuarios"

interface EditarUsuarioModalProps {
  open: boolean
  usuario?: UsuarioSistema
  onClose: () => void
  onSaved: (usuario: UsuarioSistema) => void
  currentUserRole?: string
}

const allRoles: { value: RoleUsuario; label: string }[] = [
  { value: "COLABORADOR", label: "Colaborador" },
  { value: "GESTOR", label: "Gerente" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_USER", label: "Super Admin" },
]

function getAvailableRoles(currentUserRole?: string): { value: RoleUsuario; label: string }[] {
  // Only SUPER_USER can assign ADMIN or SUPER_USER roles
  if (currentUserRole === "SUPER_USER") {
    return allRoles
  }
  // ADMIN can only assign GESTOR or COLABORADOR
  return allRoles.filter((role) => role.value === "COLABORADOR" || role.value === "GESTOR")
}

/**
 * Remove campos proibidos do payload de update
 * Apenas campos válidos: name, email, role, active, jobTitle, password (SUPER_USER only)
 */
function cleanUserPayload(formData: any, currentUserRole?: string) {
  const payload: any = {
    name: formData.name,
    jobTitle: formData.jobTitle,
    role: formData.role,
    active: formData.active,
  }

  // Only include password if SUPER_USER is editing and password is provided
  if (currentUserRole === "SUPER_USER" && formData.password?.trim()) {
    payload.password = formData.password
  }

  return payload
}

export function EditarUsuarioModal({
  open,
  usuario,
  onClose,
  onSaved,
  currentUserRole,
}: EditarUsuarioModalProps) {
  const availableRoles = getAvailableRoles(currentUserRole)
  const [form, setForm] = useState({
    name: "",
    jobTitle: "",
    role: "COLABORADOR" as RoleUsuario,
    active: true,
    password: "",
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    if (!open || !usuario) return
    setForm({
      name: usuario.name,
      jobTitle: usuario.jobTitle ?? "",
      role: usuario.role,
      active: usuario.active,
      password: "",
    })
    setErro("")
  }, [open, usuario])

  function updateField<K extends keyof typeof form>(field: K, value: any) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function salvar() {
    if (!usuario) return
    setSalvando(true)
    setErro("")

    try {
      const updatePayload = cleanUserPayload({
        name: form.name.trim(),
        jobTitle: form.jobTitle.trim(),
        role: form.role,
        active: form.active,
        password: form.password,
      }, currentUserRole)
      console.log("[EditarUsuarioModal] updatePayload:", updatePayload)

      const usuarioAtualizado = await api.updateUser(usuario.id, updatePayload)
      onSaved(usuarioAtualizado)
      toast.success(`${usuarioAtualizado.name} atualizado com sucesso`)
      onClose()
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      if (error instanceof ApiError) {
        setErro(error.message)
      } else {
        setErro("Erro ao atualizar usuário.")
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Usuário</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            salvar()
          }}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2"
        >
          {erro && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">
              {erro}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-usuario-nome">Nome completo *</Label>
            <Input
              id="edit-usuario-nome"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-usuario-cargo">Cargo (Profissão/Função) *</Label>
            <Input
              id="edit-usuario-cargo"
              value={form.jobTitle}
              onChange={(event) => updateField("jobTitle", event.target.value)}
              placeholder="Ex: Vendedor, Gerente..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-usuario-role">Nível de Acesso *</Label>
            <Select value={form.role} onValueChange={(value) => updateField("role", value as RoleUsuario)}>
              <SelectTrigger id="edit-usuario-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentUserRole === "SUPER_USER" && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-usuario-nova-senha">Nova Senha</Label>
              <Input
                id="edit-usuario-nova-senha"
                type="password"
                placeholder="Deixe em branco para manter a senha atual"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-usuario-ativo"
              checked={form.active}
              onCheckedChange={(checked) => updateField("active", checked)}
            />
            <Label htmlFor="edit-usuario-ativo" className="font-normal cursor-pointer">
              Usuário ativo
            </Label>
          </div>
        </form>

        <SheetFooter className="px-4">
          <Button variant="outline" onClick={onClose} disabled={salvando}>
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
