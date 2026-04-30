"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit2, Trash2, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UsuarioSistema } from "@/types/usuarios"

const roleCor: Record<string, string> = {
  ADMIN: "bg-zinc-900 text-white border-zinc-900",
  GESTOR: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  COLABORADOR: "bg-zinc-100 text-zinc-700 border-zinc-200",
  SUPER_USER: "bg-purple-500/10 text-purple-600 border-purple-500/20",
}

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  GESTOR: "Gerente",
  COLABORADOR: "Colaborador",
  SUPER_USER: "Super Admin",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((value) => value[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function UsuarioCard({ usuario, onEdit, onDelete }: { usuario: UsuarioSistema; onEdit?: (usuario: UsuarioSistema) => void; onDelete?: (usuarioId: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const createdAt = new Date(usuario.createdAt).toLocaleDateString("pt-BR")

  async function handleDelete() {
    if (!onDelete || !confirm("Tem certeza que deseja deletar este usuário?")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, { method: "DELETE" })
      if (!res.ok) {
        alert("Erro ao deletar usuário")
        return
      }
      onDelete(usuario.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback
            className={cn(
              "text-sm font-semibold",
              usuario.role === "ADMIN" || usuario.role === "SUPER_USER"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700"
            )}
          >
            {getInitials(usuario.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{usuario.name}</p>
            {!usuario.active && (
              <Badge
                variant="outline"
                className="border-red-500/20 px-1.5 text-xs text-red-500"
              >
                Inativo
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{usuario.email}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {usuario.jobTitle ?? "Cargo não informado"} • Cadastrado em {createdAt}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn("px-2 text-xs", roleCor[usuario.role])}>
          {roleLabel[usuario.role]}
        </Badge>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(usuario)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
