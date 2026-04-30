"use client"

import { useEffect, useState } from "react"
import { Plus, Users } from "lucide-react"
import { UsuarioCard } from "@/components/configuracoes/usuario-card"
import { NovoColaboradorModal } from "@/components/usuarios/novo-colaborador-modal"
import { EditarUsuarioModal } from "@/components/configuracoes/editar-usuario-modal"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { UsuarioSistema } from "@/types/usuarios"

interface UsuariosSectionProps {
  canManageUsers: boolean
  currentUserRole?: string
}

export function UsuariosSection({ canManageUsers, currentUserRole }: UsuariosSectionProps) {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioSistema | undefined>()

  useEffect(() => {
    async function carregarUsuarios() {
      try {
        const res = await fetch("/api/usuarios")
        if (!res.ok) return
        const data = await res.json()
        setUsuarios(data.usuarios)
      } finally {
        setLoading(false)
      }
    }

    carregarUsuarios()
  }, [])

  function handleCreated(usuario: UsuarioSistema) {
    setUsuarios((current) =>
      [...current, usuario].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    )
  }

  function handleEdit(usuario: UsuarioSistema) {
    setUsuarioEditando(usuario)
    setEditModalOpen(true)
  }

  function handleSaved(usuario: UsuarioSistema) {
    setUsuarios((current) =>
      current.map((u) => (u.id === usuario.id ? usuario : u))
    )
  }

  function handleDeleted(usuarioId: string) {
    setUsuarios((current) => current.filter((u) => u.id !== usuarioId))
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Usuários</h3>
          <span className="text-xs text-muted-foreground">
            {loading ? "Carregando..." : `${usuarios.length} cadastrados`}
          </span>
        </div>
        {canManageUsers && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Colaborador
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-xl" />
            ))
          : usuarios.map((usuario) => (
              <UsuarioCard
                key={usuario.id}
                usuario={usuario}
                onEdit={canManageUsers ? handleEdit : undefined}
                onDelete={canManageUsers ? handleDeleted : undefined}
              />
            ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Cadastro e atualização da lista em tempo real habilitados para Admin.
      </p>

      <NovoColaboradorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      {usuarioEditando && (
        <EditarUsuarioModal
          open={editModalOpen}
          usuario={usuarioEditando}
          onClose={() => {
            setEditModalOpen(false)
            setUsuarioEditando(undefined)
          }}
          onSaved={handleSaved}
          currentUserRole={currentUserRole}
        />
      )}
    </section>
  )
}
