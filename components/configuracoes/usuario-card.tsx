import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { UsuarioSistema } from "@/types/usuarios"

const roleCor: Record<string, string> = {
  ADMIN: "bg-zinc-900 text-white border-zinc-900",
  GESTOR: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  COLABORADOR: "bg-zinc-100 text-zinc-700 border-zinc-200",
}

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  GESTOR: "Gestor",
  COLABORADOR: "Colaborador",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((value) => value[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function UsuarioCard({ usuario }: { usuario: UsuarioSistema }) {
  const createdAt = new Date(usuario.createdAt).toLocaleDateString("pt-BR")

  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback
            className={cn(
              "text-sm font-semibold",
              usuario.role === "ADMIN"
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
      <Badge variant="outline" className={cn("px-2 text-xs", roleCor[usuario.role])}>
        {roleLabel[usuario.role]}
      </Badge>
    </div>
  )
}
