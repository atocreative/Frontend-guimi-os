"use client"

import { useEffect, useMemo, useState } from "react"
import { ColaboradorCard } from "@/components/colaboradores/colaborador-card"
import { Podio } from "@/components/colaboradores/podio"
import { NovoColaboradorModal } from "@/components/usuarios/novo-colaborador-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api-client"
import type { ColaboradorResumo } from "@/types/colaboradores"
import type { UsuarioSistema } from "@/types/usuarios"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((value) => value[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function buildColaboradores(usuarios: UsuarioSistema[]): ColaboradorResumo[] {
  // Filtrar super users - não devem aparecer na lista de colaboradores
  const filteredUsuarios = usuarios.filter((usuario) => {
    const isSuperUser = (usuario as any).isSuperUser === true
    return usuario.role !== "SUPER_USER" && !isSuperUser
  })

  return filteredUsuarios.map((usuario) => {
    return {
      id: usuario.id,
      nome: usuario.name,
      email: usuario.email,
      avatar: getInitials(usuario.name),
      role: usuario.role,
      ativo: usuario.active,
      jobTitle: usuario.jobTitle ?? "Cargo não informado",
      tempoEmpresa: "Novo no time",
      telefone: "Não informado",
      nivel: "Iniciante",
      nivelProgresso: 0,
      sequenciaDias: 0,
      pontosMes: 0,
      metaMes: 0,
      realizadoMes: 0,
      vendasMes: 0,
      ticketMedio: 0,
      taxaConversao: 0,
      conquistasDesbloqueadas: [],
    }
  })
}

interface ColaboradoresClientProps {
  canManageUsers: boolean
}

export { ColaboradoresClient as RankingClient }

export function ColaboradoresClient({
  canManageUsers,
}: ColaboradoresClientProps) {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  void modalOpen

  useEffect(() => {
    async function carregarUsuarios() {
      try {
        const { users } = await api.getUsers()
        setUsuarios(users)
      } catch (error) {
        console.error("Erro ao carregar usuários:", error)
      } finally {
        setLoading(false)
      }
    }

    carregarUsuarios()
  }, [])

  const colaboradores = useMemo(() => buildColaboradores(usuarios), [usuarios])

  function handleCreated(usuario: UsuarioSistema) {
    setUsuarios((current) =>
      [...current, usuario].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Ranking</h2>
          <p className="text-sm text-muted-foreground">
            Corrida Guimicell — Performance e Conquistas da equipe.
          </p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <Podio colaboradores={colaboradores} />
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold">Time</h3>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {colaboradores.map((colaborador) => (
              <ColaboradorCard key={colaborador.id} colaborador={colaborador} />
            ))}
          </div>
        )}
      </div>


      <NovoColaboradorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}
