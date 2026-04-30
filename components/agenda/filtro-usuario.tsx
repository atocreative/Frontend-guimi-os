"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { UsuarioSimples } from "@/types/tarefas"

interface FiltroUsuarioProps {
  usuarios: UsuarioSimples[]
  selecionado: string | null
  onSelecionar: (id: string | null) => void
}

export function FiltroUsuario({
  usuarios,
  selecionado,
  onSelecionar,
}: FiltroUsuarioProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={selecionado === null ? "default" : "outline"}
        size="sm"
        className="h-8 text-xs"
        onClick={() => onSelecionar(null)}
      >
        Time completo
      </Button>
      {usuarios.map((u) => (
        <button
          key={u.id}
          onClick={() => onSelecionar(u.id)}
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
            selecionado === u.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted border-border"
          )}
        >
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-xs bg-secondary text-secondary-foreground font-semibold">
              {u.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {u.name}
        </button>
      ))}
    </div>
  )
}
