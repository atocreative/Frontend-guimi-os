"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { mockColaboradores, mockConquistas, mockIndicadoresTime } from "@/app/(dashboard)/data/mock"
import { ColaboradorCard } from "@/components/colaboradores/colaborador-card"
import { Conquistas } from "@/components/colaboradores/conquistas"
import { Podio } from "@/components/colaboradores/podio"
import { NovoColaboradorModal } from "@/components/usuarios/novo-colaborador-modal"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
  return usuarios.map((usuario) => {
    const mockColaborador = mockColaboradores.find(
      (item) => item.email.toLowerCase() === usuario.email.toLowerCase()
    )
    const mockIndicador =
      mockIndicadoresTime.find(
        (item) => item.nome.toLowerCase() === usuario.name.toLowerCase()
      ) ??
      mockIndicadoresTime.find(
        (item) =>
          mockColaborador &&
          item.nome.toLowerCase() === mockColaborador.nome.toLowerCase()
      )

    return {
      id: usuario.id,
      nome: usuario.name,
      email: usuario.email,
      cargo: usuario.jobTitle ?? mockColaborador?.cargo ?? "Cargo não informado",
      avatar: mockColaborador?.avatar ?? getInitials(usuario.name),
      role: usuario.role,
      ativo: usuario.active,
      tempoEmpresa: mockColaborador?.tempoEmpresa ?? "Novo no time",
      telefone: mockColaborador?.telefone ?? "Não informado",
      nivel: mockColaborador?.nivel ?? "Iniciante",
      nivelProgresso: mockColaborador?.nivelProgresso ?? 0,
      sequenciaDias: mockColaborador?.sequenciaDias ?? 0,
      pontosMes: mockColaborador?.pontosMes ?? 0,
      metaMes: mockIndicador?.metaMes ?? mockColaborador?.metaMes ?? 0,
      realizadoMes:
        mockIndicador?.faturamentoMes ?? mockColaborador?.realizadoMes ?? 0,
      vendasMes: mockIndicador?.vendasMes ?? 0,
      ticketMedio: mockIndicador?.ticketMedio ?? 0,
      taxaConversao: mockIndicador?.taxaConversao ?? 0,
      conquistasDesbloqueadas: mockColaborador?.conquistasDesbloqueadas ?? [],
    }
  })
}

interface ColaboradoresClientProps {
  canManageUsers: boolean
}

export function ColaboradoresClient({
  canManageUsers,
}: ColaboradoresClientProps) {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

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
          <h2 className="text-xl font-semibold">Colaboradores</h2>
          <p className="text-sm text-muted-foreground">
            Corrida Guimicell - Performance e Conquistas.
          </p>
        </div>
        {canManageUsers && (
          <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Colaborador
          </Button>
        )}
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

      {!loading &&
        colaboradores.map((colaborador) => (
          <div key={colaborador.id}>
            <h3 className="mb-3 text-sm font-semibold">
              Conquistas — {colaborador.nome}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {colaborador.conquistasDesbloqueadas.length}/{mockConquistas.length} desbloqueadas
              </span>
            </h3>
            <Conquistas
              conquistas={mockConquistas}
              desbloqueadas={colaborador.conquistasDesbloqueadas}
            />
          </div>
        ))}

      <NovoColaboradorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}
